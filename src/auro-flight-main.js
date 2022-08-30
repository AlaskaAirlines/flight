// Copyright (c) 2021 Alaska Airlines. All right reserved. Licensed under the Apache-2.0 license
// See LICENSE in the project root for license information.

// ---------------------------------------------------------------------

// If use litElement base class
import { LitElement, html, css } from "lit-element";
import styleCss from "./style-flight-main-css.js";
import { getDateDifference } from './../util/util';

// See https://git.io/JJ6SJ for "How to document your components using JSDoc"
/**
 * The auro-flight-main element renders the middle 'frame' of the auro-flight component with the auro-flightline.
 * DoT: STATION SIZE AND COLOR MUST BE IDENTICAL TO DISCLOSURE SIZE AND COLOR!
 *
 * @attr {Array} stops - Array of objects representing stopovers or layovers: "isStopover": bool, "arrivalStation": string, "duration": string ["123hr 123m"] (layover only). This content will not be used in the UI, but only constructs the a11y conversational phrase for screen readers and has no effect on the `auro-flight-segment` content.
 * @attr {Array} flights - Array of flight numbers `['AS 123', 'EK 432']`
 * @attr {Number} duration - String for the duration. `505`
 * @attr {String} arrivalTime - ISO 8601 time of arrival, e.g. `2022-04-13T12:30:00-04:00`
 * @attr {String} arrivalStation - Station of arrival, e.g. `SEA`
 * @attr {String} departureTime - ISO 8601 time of departure, e.g. `2022-04-13T12:30:00-04:00`
 * @attr {String} departureStation - Station of departure, e.g. `PVD`
 * @attr {String} reroutedDepartureStation - Station of rerouted departure, e.g. `PDX`
 * @attr {String} reroutedArrivalStation - Station of rerouted arrival, e.g. `AVP`
 * @slot default - anticipates `<auro-flight-segment>` instances
 */

// build the component class
class AuroFlightMain extends LitElement {

  // function to define props used within the scope of this component
  static get properties() {
    return {
      stops:                    { type: Array },
      flights:                  { type: Array },
      duration:                 { type: Number },
      arrivalTime:              { type: String },
      arrivalStation:           { type: String },
      departureTime:            { type: String },
      departureStation:         { type: String },
      reroutedArrivalStation:   { type: String },
      reroutedDepartureStation: { type: String },
    };
  }

  static get styles() {
    return css`
      ${styleCss}
    `;
  }

  constructor() {
    super();

    /**
     * Time template object used by convertTime() method.
     */
    this.timeTemplate = {
      hour: "2-digit",
      minute: "2-digit",
    };

    this.template = {};
  }

  /**
   * @private
   * @param {string} time - UTC time.
   * @returns Localized time based from UTC string.
   */
  convertTime(time) {
    const slicedTime = time.slice(0, -6);
    const newTime = new Date(slicedTime);
    const localizedTime = newTime.toLocaleString('en-US', this.timeTemplate).replace(/^0+/u, '');

    return localizedTime;
  }

  /**
   * @private
   * @param {string} station Airport code ex: SEA.
   * @returns Mutated string.
   */
  readStation(station) {
    return Array.from(station).join(' ');
  }

  /**
   * @param {number} idx A numbered index correlated to current stop.
   * @private
   * @returns A comma string or an empty string.
   */
  addComma(idx) {
    return idx === this.stops.length - 1 ? '' : ', ';
  }

  /**
   * @private
   * @returns Composed screen reader summary.
   */
  composeScreenReaderSummary() {
    const hasReroute = this.reroutedDepartureStation && this.reroutedDepartureStation !== 'undefined';
    const dayDiff = getDateDifference(this.departureTime, this.arrivalTime);
    const daysFromDeparture = dayDiff === 1 ? 'next day' : `${dayDiff} days later`;
    const secondToLastIndex = 2;
    const layoverStopoverStringArray = this.stops
      ? this.stops.map((segment, idx) => html`
      with a ${segment.isStopover ? 'stop' : 'layover'} in ${this.readStation(segment.arrivalStation)}
      ${segment.duration ? `, for ${segment.duration}` : ''}${this.addComma(idx)}
      ${idx === this.stops.length - secondToLastIndex ? ' and ' : ''}`)
      : ', nonstop';

    const departureStation = this.readStation(this.departureStation);
    const departureTime = this.convertTime(this.departureTime);
    const arrivalStation = this.readStation(this.arrivalStation);
    const arrivalTime = this.convertTime(this.arrivalTime);
    let reroutedDepartureStation = '';
    let reroutedArrivalStation = '';

    if (hasReroute) {
      reroutedDepartureStation = this.readStation(this.reroutedDepartureStation);
      reroutedArrivalStation = this.readStation(this.reroutedArrivalStation);
    }

    return html`
      ${!hasReroute
        ? `Departs from ${departureStation} at ${departureTime}, arrives ${arrivalStation} at ${arrivalTime}`
        : `Flight ${reroutedDepartureStation} to ${reroutedArrivalStation} has been re-routed.
        The flight now departs from ${departureStation} at ${departureTime},
        and arrives ${arrivalStation} at ${arrivalTime}`} ${dayDiff > 0 ? `, ${daysFromDeparture}` : ''}
        ${this.stops ? ', ' : ''} ${layoverStopoverStringArray}.
    `;
  }

  // function that renders the HTML and CSS into  the scope of the component
  render() {
    const hasReroute = this.reroutedDepartureStation && this.reroutedDepartureStation !== 'undefined';
    return html`
        <script type="application/ld+json">
          {
            "@context": "https://schema.org/",
            "@type": "Flight",
            "departureTime": "${this.departureTime}",
            "arrivalTime": "${this.arrivalTime}",
            "estimatedFlightDuration": "${this.duration}",
            "name": "Flight${this.flights.length > 1 ? 's' : ''} ${this.flights.join(',')}",
            "arrivalAirport": "${this.arrivalStation}",
            "departureAirport": "${this.departureStation}",
            "description": "Departs from ${this.departureStation} at ${this.convertTime(this.departureTime)}, arrives ${this.arrivalStation} at ${this.convertTime(this.arrivalTime)}"
          }
        </script>
        <div class="util_displayHiddenVisually">
          ${this.composeScreenReaderSummary()}
        </div>
        <div class="departure" aria-hidden="true">
          <time class="departureTime">
            <auro-datetime type="tzTime" setDate="${this.departureTime}"></auro-datetime>
          </time>
          <span class="departureStation">
          ${hasReroute
            ? html`
              <span class="util_lineThrough">
                ${this.reroutedDepartureStation}
              </span>`
            : html``}

            ${this.departureStation}
          </span>
        </div>
        <div class="slotContainer" aria-hidden="true">
          <slot></slot>
        </div>
        <div class="arrival" aria-hidden="true">
          <time class="arrivalTime">
            <auro-datetime type="tzTime" setDate="${this.arrivalTime}"></auro-datetime>
          </time>
          <span class="arrivalStation">
            ${hasReroute
              ? html`
                <span class="util_lineThrough">
                  ${this.reroutedArrivalStation}
                </span>`
              : html``}

            ${this.arrivalStation}
          </span>
        </div>
    `;
  }
}

/* istanbul ignore else */
// define the name of the custom component
if (!customElements.get("auro-flight-main")) {
  customElements.define("auro-flight-main", AuroFlightMain);
}
