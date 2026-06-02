import mapboxgl from "mapbox-gl";
import Swiper from "swiper";
import { Navigation } from "swiper/modules";
import "mapbox-gl/dist/mapbox-gl.css";
import "./s3d2-Mapbox.scss";
// import "swiper/css";

if (typeof Swiper.use === "function") Swiper.use([Navigation]);

const MARKERS_BASE_PATH =
  window.location.hostname === "localhost" ? "/src/shared/images/markers" : `/assets/images/markers`;
const markerIcon = (fileName) => `${MARKERS_BASE_PATH}/${fileName}`;

const DEFAULT_TYPE_ICONS = {
  main: markerIcon("main.png"),
  club: markerIcon("commercial.svg"),
  sport: markerIcon("sport.svg"),
  terminal: markerIcon("marker2.svg"),
  parking: markerIcon("parking.svg"),
  shop: markerIcon("shop.svg"),
  walking: markerIcon("walking.svg"),
  entertainment: markerIcon("entertainment.svg"),
  underground: markerIcon("underground.svg"),
  street: markerIcon("street.svg"),
  workout: markerIcon("workout.svg"),
  atm: markerIcon("atm.svg"),
  lake: markerIcon("lake.svg"),
  tennis: markerIcon("tennis.svg"),
  school: markerIcon("school.svg"),
  pharmacy: markerIcon("pharmacy.svg"),
  restaurant: markerIcon("restaurant.svg"),
  default: markerIcon("marker.svg"),
  ports: markerIcon("port.svg"),
  marinas: markerIcon("doughnut.svg"),
  terminal: markerIcon("terminal.svg"),
  zoo: markerIcon("zoo.svg"),
};

const MODE_LABELS = {
  walking: "Walking",
  driving: "Driving",
  cycling: "Cycling",
};

export default class MapboxBlock {
  constructor({ mountTo, accessToken, center, markers = [], i18n, zoom = 17 }) {
    this.root = typeof mountTo === "string" ? document.querySelector(mountTo) : mountTo;

    if (!this.root) throw new Error("Mount element not found");
    mapboxgl.accessToken = accessToken;
    this.center = this.toLngLat(center, center);
    this.markers = markers.map((marker) => {
      const normalizedCoordinates = this.toLngLat(marker.coordinates, [marker.lng, marker.lat]);
      return {
        ...marker,
        coordinates: normalizedCoordinates,
        lng: normalizedCoordinates[0],
        lat: normalizedCoordinates[1],
        type: marker.type || "poi",
        icon: marker.icon || DEFAULT_TYPE_ICONS[marker.type] || DEFAULT_TYPE_ICONS.default,
      };
    });
    this.zoom = zoom;
    this.i18n = i18n;
    this.activeFilters = new Set();
    this.markerInstances = [];
    this.routeSourceId = "mapbox-route-source";
    this.routeLayerId = "mapbox-route-layer";
    this.sliderInstance = null;
    this.routeCoordinates = [];
    this.isAnimatingRoute = false;
    this.currentMarker = null;
    this.routeCache = {}; // Cache for route queries
    this.routeFlowAnimationFrame = null;
    this.routeFlowPhase = 0;
    this.routeBaseColor = "#00008B";
    this.isZoomEnabled = false;

    this.render();
    this.initMap();
  }

  toLngLat(coordinates, fallback = [0, 0]) {
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const [latRaw, lngRaw] = coordinates;
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return [lng, lat];
      }
    }

    if (Array.isArray(fallback) && fallback.length >= 2) {
      const [lngRaw, latRaw] = fallback;
      const lng = Number(lngRaw);
      const lat = Number(latRaw);
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        return [lng, lat];
      }
    }

    return [0, 0];
  }

  getTypeLabel(type) {
    const labels = {
      main: this.i18n.t("Map.location.type.main") || "Main location",
      poi: this.i18n.t("Map.location.type.poi") || "Point of interest",
      club: this.i18n.t("Map.location.type.club") || "Club",
      terminal: this.i18n.t("Map.location.type.terminal") || "Terminal",
      parking: this.i18n.t("Map.location.type.parking") || "Parking",
      shop: this.i18n.t("Map.location.type.shop") || "Shop",
      walking: this.i18n.t("Map.location.type.walking") || "Walking Area",
      entertainment: this.i18n.t("Map.location.type.entertainment") || "Entertainment",
      underground: this.i18n.t("Map.location.type.underground") || "Metro",
      street: this.i18n.t("Map.location.type.street") || "Street",
      ports: this.i18n.t("Map.location.type.ports") || "Ports",
      sport: this.i18n.t("Map.location.type.sport") || "Sport",
      marinas: this.i18n.t("Map.location.type.marinas") || "Marinas",
      school: this.i18n.t("Map.location.type.school") || "Schools",
      lake: this.i18n.t("Map.location.type.lake") || "Lake",
      workout: this.i18n.t("Map.location.type.workout") || "Workout",
      atm: this.i18n.t("Map.location.type.atm") || "ATM",
      tennis: this.i18n.t("Map.location.type.tennis") || "Tennis",
      pharmacy: this.i18n.t("Map.location.type.pharmacy") || "Pharmacy",
      restaurant: this.i18n.t("Map.location.type.restaurant") || "Restaurant",
      zoo: this.i18n.t("Map.location.type.zoo") || "Zoo",
    };
    return labels[type] || type;
  }

  getTypeIcon(type) {
    return DEFAULT_TYPE_ICONS[type] || DEFAULT_TYPE_ICONS.default;
  }

  render() {
    const filterOpenLabel = this.i18n.t("Map.location.showFilter") || "Show filter";
    const filterCloseLabel = this.i18n.t("Map.location.closeFilter") || "Close filter";
    const enableZoom = this.i18n.t("Map.location.enableZoom") || "Click to Zoom";
    const disableZoom = this.i18n.t("Map.location.disableZoom") || "Stop Zoom";
    // Filter out 'main' marker type from buttons
    const filterButtons = [...new Set(this.markers.map((marker) => marker.type))]
      .filter((type) => type !== "main")
      .map(
        (type) => `
      <button type="button" class="mapbox-filter-button" data-filter="${type}">
        <span class="mapbox-filter-button__icon">
          <img src="${this.getTypeIcon(type)}" alt="${this.getTypeLabel(type)}" />
        </span>
        <span>${this.getTypeLabel(type)}</span>
      </button>
    `,
      );

    this.root.innerHTML = `
     
       
        <div class="mapbox-block__map-container">
          <div class="map-controls" data-theme="day" style="--thumb-progress: 33.333" aria-label="Map theme switcher">
            <input
              type="range"
              class="map-controls__range"
              min="0"
              max="100"
              step="0.1"
              value="33.333"
              aria-label="Map theme slider"
            />
            <button type="button" class="map-button" id="dawn" data-theme="dawn" data-theme-index="0" aria-label="Dawn mode" aria-pressed="false">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <circle cx="19" cy="19" r="18.5" fill="white" />
                  <path d="M29.9414 29.9673L7.44141 29.9673" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M24.717 29.9669C24.717 26.8095 22.1574 24.25 19.0001 24.25C15.8427 24.25 13.2832 26.8095 13.2832 29.9669" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M18.998 17.9084V20.3202" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M18.998 12.7725L18.998 6.53246" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M22.1094 8.33984L19.0723 5.95312" stroke="#4264FB" stroke-width="2" stroke-linecap="round" />
                  <path d="M15.8867 8.33984L18.9238 5.95312" stroke="#4264FB" stroke-width="2" stroke-linecap="round" />
                  <path d="M10.4746 21.4402L12.1786 23.1458" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M27.5245 21.4402L25.8184 23.1458" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                </g>
              </svg>
            </button>
            <button type="button" class="map-button" id="day" data-theme="day" data-theme-index="1" aria-label="Day mode" aria-pressed="false">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <circle cx="19" cy="19.0002" r="18.5" fill="white" />
                  <path d="M19 24.5467C22.0635 24.5467 24.5469 22.0632 24.5469 18.9998C24.5469 15.9363 22.0635 13.4529 19 13.4529C15.9366 13.4529 13.4531 15.9363 13.4531 18.9998C13.4531 22.0632 15.9366 24.5467 19 24.5467Z" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M19 7.30005V9.6401" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M10.7285 10.7268L12.3819 12.3817" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M7.30078 18.9998H9.64083" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M10.7285 27.2725L12.3834 25.6182" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M19 30.6999V28.3589" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M27.2726 27.2725L25.6172 25.6182" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M30.6994 19.0002H28.3594" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M27.2726 10.7268L25.6172 12.3817" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                </g>
              </svg>
            </button>
            <button type="button" class="map-button" id="dusk" data-theme="dusk" data-theme-index="2" aria-label="Dusk mode" aria-pressed="false">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <circle cx="19" cy="19" r="18.5" fill="white" />
                  <path d="M24.4979 28.9589C24.4979 25.923 22.0368 23.4619 19.0009 23.4619C15.965 23.4619 13.5039 25.923 13.5039 28.9589" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M19 17.3643V19.6833" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M10.8008 20.7603L12.4393 22.4003" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M30.25 28.9592L7.75 28.9592" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M27.1991 20.7603L25.5586 22.4003" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M18.998 5.90894L18.998 12.1489" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M15.8887 10.3416L18.9258 12.7283" stroke="#4264FB" stroke-width="2" stroke-linecap="round" />
                  <path d="M22.1113 10.3416L19.0742 12.7283" stroke="#4264FB" stroke-width="2" stroke-linecap="round" />
                </g>
              </svg>
            </button>
            <button type="button" class="map-button" id="night" data-theme="night" data-theme-index="3" aria-label="Night mode" aria-pressed="false">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <circle cx="19" cy="19" r="18.5" fill="white" />
                  <path d="M18.53 27.9489C14.9462 28.7919 11.3593 27.5714 9.01172 25.0631C10.617 25.5423 12.3651 25.6235 14.1138 25.2139C19.4467 23.9597 22.7537 18.6189 21.4996 13.2864C21.0884 11.5378 20.2364 10.01 19.0919 8.78589C22.3837 9.77013 25.0744 12.4361 25.9173 16.0214C27.1705 21.3549 23.864 26.6947 18.53 27.9489Z" stroke="#4264FB" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                </g>
              </svg>
            </button>
          </div>
          <div class="mapbox-block__map"></div>
          <div class="mapbox-block__filter-bottom">
            <button type="button" class="mapbox-filter-toggle" data-label-open="${filterOpenLabel}" data-label-close="${filterCloseLabel}">
              ${filterOpenLabel}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div class="mapbox-block__zoom-reset-buttons">
              <button type="button" class="mapbox-block__zoom-toggle-btn" aria-label="Toggle scroll zoom" aria-pressed="false" data-label-open="${enableZoom}" data-label-close="${disableZoom}">
                ${enableZoom}
              </button>
              <button type="button" class="mapbox-block__reset-btn" aria-label="Return to main location">
                ${this.i18n.t("Map.location.reCenter") || "Re-center"}
              </button>
            </div>

            <div class="mapbox-block__filters-panel">
              <div class="mapbox-block__filters">${filterButtons.join("")}</div>
            </div>
          </div>
          <aside class="mapbox-block__info-panel" data-lenis-prevent>
            <button type="button" class="mapbox-block__info-close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M17.707 8L13.207 12.5L17.707 17L17 17.707L12.5 13.207L8 17.707L7.29297 17L11.793 12.5L7.29297 8L8 7.29297L12.5 11.793L17 7.29297L17.707 8Z" fill="#1A1E21"/>
              </svg>
            </button>

            <div class="mapbox-block__info-gallery swiper">
              <div class="swiper-wrapper"></div>
              <div class="swiper-button-prev mapbox-info__swiper-prev" aria-label="Previous slide">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.5 2.5L4.5 7L9.5 11.5"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="swiper-button-next mapbox-info__swiper-next" aria-label="Next slide">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.5 2.5L9.5 7L4.5 11.5"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <div class="mapbox-block__info-title"></div>
            <div class="mapbox-block__info-subtitle"></div>
            <div class="mapbox-block__travel-grid">

              <div class="mapbox-block__travel-item">
                <div class="mapbox-block__travel-head">
                <span class="mapbox-block__travel-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -4 24 24" fill="none">
                    <path d="M8.19043 4C6.59587 4.00012 4.99625 4.73421 4.38477 5.10254C4.37855 5.10628 4.37226 5.11025 4.36621 5.11426L3.12695 5.93652H1.36816L1.34277 5.9375C1.19792 5.94492 0.983931 5.98731 0.790039 6.11035C0.575584 6.2465 0.37225 6.49646 0.37207 6.86426V8.0957L0.202148 8.22266C0.107185 8.29325 0.0407715 8.39513 0.0136719 8.50781L0 8.62402V9.95703C0 10.1656 0.129887 10.3527 0.325195 10.4258L2.4375 11.2129C2.4371 11.2328 2.43557 11.2535 2.43555 11.2734C2.43573 12.8923 3.74836 14.2049 5.36719 14.2051C6.73739 14.2051 7.88539 13.2645 8.20703 11.9941H16.2334C16.555 13.2644 17.7032 14.2049 19.0732 14.2051C20.4951 14.205 21.6765 13.1919 21.9443 11.8486C22.2369 11.8288 22.5394 11.7933 22.8066 11.7256C23.0067 11.6748 23.2197 11.5992 23.3984 11.4805C23.5798 11.3599 23.7719 11.1612 23.8174 10.8623C23.9173 10.204 23.9505 9.53055 23.9941 9.13184C24.0282 8.81984 23.8702 8.50631 23.6533 8.25586C23.4213 7.98813 23.0659 7.72182 22.5654 7.48633C21.5656 7.01607 19.9274 6.64067 17.3203 6.64062H17.2051C14.8865 4.69031 12.2244 4.08518 10.793 4.00879L10.5176 4H8.19043ZM19.0732 9.3418C20.1399 9.34185 21.0046 10.2069 21.0049 11.2734C21.0049 11.2987 21.0039 11.3246 21.0029 11.3496C20.9629 12.3808 20.1144 13.205 19.0732 13.2051C18.066 13.2049 17.2381 12.4331 17.1494 11.4492C17.1442 11.3916 17.1416 11.3326 17.1416 11.2734C17.1419 10.2069 18.0067 9.34198 19.0732 9.3418ZM5.36719 9.3418C6.43387 9.3418 7.29857 10.2068 7.29883 11.2734C7.29882 11.3327 7.29619 11.3916 7.29102 11.4492C7.20234 12.4332 6.37456 13.2051 5.36719 13.2051C4.30065 13.2049 3.43573 12.34 3.43555 11.2734C3.43557 11.166 3.44425 11.06 3.46094 10.958C3.6112 10.0415 4.40824 9.342 5.36719 9.3418ZM4.59668 6.16113C5.25607 6.68425 6.16999 7.01948 7.05371 7.23633C8.109 7.4952 9.2164 7.60913 10.0273 7.64062H17.3203C19.8466 7.64067 21.3222 8.00714 22.1396 8.3916C22.547 8.58329 22.7781 8.77353 22.8975 8.91113C22.9656 8.98994 22.9888 9.04019 22.9961 9.05859C22.9453 9.53824 22.9251 10.0443 22.8369 10.6504C22.7895 10.6801 22.7021 10.7202 22.5615 10.7559C22.3912 10.799 22.186 10.8267 21.9697 10.8447C21.7619 9.42923 20.5464 8.34185 19.0732 8.3418C17.5485 8.34197 16.295 9.50618 16.1543 10.9941H8.28613C8.14542 9.50609 6.89206 8.3418 5.36719 8.3418C4.12 8.34197 3.05648 9.1211 2.63281 10.2188L1 9.60938V8.875L1.1709 8.74902C1.29762 8.65467 1.37207 8.50566 1.37207 8.34766V6.93945C1.37883 6.93805 1.3847 6.937 1.38867 6.93652H3.27832C3.3765 6.93652 3.47283 6.90772 3.55469 6.85352L4.59668 6.16113ZM10.5469 5.00098C11.5423 5.01565 13.561 5.38065 15.5195 6.64062H10.5469V5.00098ZM9.54688 5V6.60938C8.86618 6.55805 8.0592 6.45286 7.29199 6.26465C6.6284 6.10181 6.03497 5.88501 5.57812 5.61914C6.26158 5.3197 7.24436 5.00009 8.19043 5H9.54688Z" fill="#1A1E21"/>
                  </svg>
                </span>
                
                </div>
                <strong data-travel-mode="driving">--</strong>
              </div>
              <div class="mapbox-block__travel-item">
                <div class="mapbox-block__travel-head">
                <span class="mapbox-block__travel-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="7" cy="17" r="2.5" stroke="currentColor" stroke-width="1.8"/>
                    <circle cx="17" cy="17" r="2.5" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M7 17L10 10H13L17 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 10H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                </span>
                
                </div>
                <strong data-travel-mode="cycling">--</strong>
              </div>
              <div class="mapbox-block__travel-item">
                <div class="mapbox-block__travel-head">
                <span class="mapbox-block__travel-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M11.5 7C10.7676 7 9.49088 6.9885 8.41016 7.70898C7.28581 8.45864 6.5 9.90006 6.5 12.5C6.5002 12.776 6.72398 13 7 13C7.27602 13 7.4998 12.776 7.5 12.5C7.5 10.1003 8.21435 9.04143 8.96484 8.54102C9.59181 8.12304 10.3304 8.02938 10.9912 8.00781C10.9491 9.97392 10.673 11.7562 10.3496 13.1572C10.0666 14.3832 9.75113 15.305 9.54199 15.7949C8.55711 17.7614 7.5899 19.2031 6.64648 20.1465C6.45141 20.3418 6.45128 20.6583 6.64648 20.8535C6.8417 21.0485 7.1583 21.0485 7.35352 20.8535C8.40694 19.8001 9.43555 18.247 10.4473 16.2236C10.4516 16.215 10.4561 16.2061 10.46 16.1973C10.6455 15.7644 10.8866 15.0697 11.124 14.1807C12.866 15.7975 14.0748 17.9899 14.5068 20.582C14.5524 20.8541 14.8098 21.0384 15.082 20.9932C15.3542 20.9478 15.5382 20.6902 15.4932 20.418C14.9921 17.4114 13.5199 14.8789 11.3887 13.0801C11.6902 11.6972 11.9422 9.99366 11.9893 8.12305C12.0042 8.13794 12.0213 8.15378 12.0371 8.1748C12.0955 8.25268 12.1557 8.36509 12.2412 8.55176C12.321 8.72587 12.4228 8.96379 12.5527 9.22363C13.1758 10.4693 14.9149 11.5 18 11.5C18.276 11.5 18.4998 11.276 18.5 11C18.5 10.7239 18.2761 10.5 18 10.5C15.0857 10.5 13.8245 9.53052 13.4473 8.77637C13.3273 8.53652 13.2414 8.33647 13.1494 8.13574C13.0633 7.94785 12.9668 7.74717 12.8379 7.5752C12.6996 7.39085 12.5225 7.23489 12.2803 7.13281C12.0483 7.03515 11.7875 7 11.5 7ZM12 3C11.4466 3 11 3.44665 11 4C11.0002 4.55321 11.4468 5 12 5C12.5533 5 12.9998 4.55318 13 4C13 3.44662 12.5534 3 12 3Z" fill="#1A1E21"/>
                  </svg>
                </span>
                
                </div>
                <strong data-travel-mode="walking">--</strong>
              </div>
            </div>
          </aside>
          <div class="mapbox-block__locations-list">
            <button type="button" class="mapbox-block__info-close mapbox-block__location-close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M17.707 8L13.207 12.5L17.707 17L17 17.707L12.5 13.207L8 17.707L7.29297 17L11.793 12.5L7.29297 8L8 7.29297L12.5 11.793L17 7.29297L17.707 8Z" fill="#1A1E21"/>
              </svg>
            </button>
            <div class="mapbox-block__locations-list-inner"></div>
          </div>
    `;

    this.mapContainer = this.root.querySelector(".mapbox-block__map");
    this.infoPanel = this.root.querySelector(".mapbox-block__info-panel");
    this.infoTitle = this.root.querySelector(".mapbox-block__info-title");
    this.infoSubtitle = this.root.querySelector(".mapbox-block__info-subtitle");
    this.galleryWrapper = this.root.querySelector(".mapbox-block__info-gallery .swiper-wrapper");
    this.travelFields = {
      walking: this.root.querySelector('[data-travel-mode="walking"]'),
      driving: this.root.querySelector('[data-travel-mode="driving"]'),
      cycling: this.root.querySelector('[data-travel-mode="cycling"]'),
    };
    this.filterToggleButton = this.root.querySelector(".mapbox-filter-toggle");
    this.filtersPanel = this.root.querySelector(".mapbox-block__filters-panel");
    this.closeInfoButton = this.root.querySelector(".mapbox-block__info-close");
    this.closeInfoButton.addEventListener("click", () => this.hideInfoPanel());
    this.closeListLocationButton = this.root.querySelector(".mapbox-block__location-close");
    this.closeListLocationButton?.addEventListener("click", () => this.hideLocationsList());
  }

  initMap() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: "mapbox://styles/mapbox/standard",
      center: this.center,
      zoom: this.zoom,
      pitch: 45,
      bearing: -20,
      scrollZoom: false,
      touchZoomRotate: false,
      touchPitch: false,
      dragPan: window.innerWidth > 768,
    });

    this.map.addControl(new mapboxgl.NavigationControl());

    const resetBtn = this.root.querySelector(".mapbox-block__reset-btn");

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        const mainMarker = this.getMainMarker();
        if (!mainMarker) return;

        const [lng, lat] = mainMarker.coordinates || [mainMarker.lng, mainMarker.lat];

        this.map.flyTo({
          center: [lng, lat],
          zoom: this.zoom,
          pitch: 45,
          bearing: -20,
          speed: 0.9,
        });

        this.map.touchZoomRotate.disableRotation(); // опційно: лишаємо тільки зум без ротації
        this.map.touchZoomRotate.disable(); // вимикаємо тач-зум за замовчуванням

        this.hideInfoPanel();
        this.clearRoute();
        this.routeCoordinates = [];
      });
    }

    const zoomToggleBtn = this.root.querySelector(".mapbox-block__zoom-toggle-btn");
    if (zoomToggleBtn) {
      const labelOpen = zoomToggleBtn.dataset.labelOpen;
      const labelClose = zoomToggleBtn.dataset.labelClose;

      const setZoomMode = (isEnabled) => {
        this.isZoomEnabled = isEnabled;

        if (isEnabled) {
          this.map.scrollZoom.enable();
          this.map.touchZoomRotate.enable();
          this.map.touchPitch.enable();
          this.map.dragPan.enable();
        } else {
          this.map.scrollZoom.disable();
          this.map.touchZoomRotate.disable();
          this.map.touchPitch.disable();
          if (window.innerWidth <= 768) {
            this.map.dragPan.disable();
          }
        }

        zoomToggleBtn.setAttribute("aria-pressed", String(isEnabled));
        zoomToggleBtn.classList.toggle("active", isEnabled);
        zoomToggleBtn.textContent = isEnabled ? labelClose : labelOpen;
      };

      setZoomMode(false);

      this.mapContainer?.addEventListener(
        "wheel",
        (event) => {
          if (!this.isZoomEnabled) return;
          event.preventDefault();
          event.stopPropagation();
        },
        { passive: false },
      );

      zoomToggleBtn.addEventListener("click", () => {
        setZoomMode(!this.isZoomEnabled);
      });
    }

    this.map.on("load", () => {
      this.addTerrainAndSky();
      // this.add3DBuildings();
      this.addRouteSource();
      this.addMarkers();
      this.initCameraOrbit();
      this.fitToMarkers();
      this.initThemeButtons();
      this.initFilterButtons();
      this.initFilterPanel();
    });
  }

  initThemeButtons() {
    const controls = this.root.querySelector(".map-controls");
    const rangeInput = controls?.querySelector(".map-controls__range");
    const defaultLightPreset = this.map.getConfigProperty("basemap", "lightPreset") || "day";
    const themeOrder = ["dawn", "day", "dusk", "night"];
    const defaultTheme = themeOrder.includes(defaultLightPreset) ? defaultLightPreset : "day";
    const stageProgress = {
      dawn: 0,
      day: 33.333,
      dusk: 66.667,
      night: 100,
    };

    let currentTheme = defaultTheme;

    const getThemeByProgress = (progress) => {
      if (progress < 25) return "dawn";
      if (progress < 50) return "day";
      if (progress < 75) return "dusk";
      return "night";
    };

    const setThumbProgress = (progress) => {
      if (!controls) return;
      const normalized = Math.min(100, Math.max(0, Number(progress) || 0));
      controls.style.setProperty("--thumb-progress", String(normalized));
    };

    const applyThemeState = (theme, options = {}) => {
      const { syncRange = true, progress = stageProgress[theme] ?? 33.333 } = options;
      if (controls) {
        controls.dataset.theme = theme;
        setThumbProgress(progress);
      }
      if (rangeInput && syncRange) {
        rangeInput.value = String(progress);
      }

      this.root.querySelectorAll(".map-button").forEach((controlButton) => {
        const isActive = (controlButton.dataset.theme || controlButton.id) === theme;
        controlButton.classList.toggle("selected", isActive);
        controlButton.setAttribute("aria-pressed", String(isActive));
      });
    };

    applyThemeState(defaultTheme, {
      syncRange: true,
      progress: stageProgress[defaultTheme],
    });

    if (rangeInput) {
      rangeInput.addEventListener("input", () => {
        const progress = Number(rangeInput.value);
        setThumbProgress(progress);

        const nextTheme = getThemeByProgress(progress);
        if (nextTheme !== currentTheme) {
          currentTheme = nextTheme;
          this.map.setConfigProperty("basemap", "lightPreset", nextTheme);
          applyThemeState(nextTheme, { syncRange: false, progress });
        }
      });
    }

    this.root.querySelectorAll(".map-button").forEach((button) => {
      button.addEventListener("click", () => {
        const theme = button.dataset.theme || button.id;
        currentTheme = theme;
        this.map.setConfigProperty("basemap", "lightPreset", theme);
        applyThemeState(theme, {
          syncRange: true,
          progress: stageProgress[theme],
        });
      });
    });
  }

  initFilterButtons() {
    this.root.querySelectorAll(".mapbox-filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        if (!filter) return;

        const isSelected = button.classList.toggle("selected");
        if (isSelected) {
          this.activeFilters.add(filter);

          const categoryMarkers = this.markers.filter((m) => m.type === filter);

          this.flyToCategoryMarker(filter);

          if (categoryMarkers.length > 1) {
            this.showLocationsList(categoryMarkers, filter);
          }
        } else {
          button.classList.remove("selected");
          this.activeFilters.delete(filter);
          this.removeFromLocationsList(filter);
        }
        this.updateMarkerVisibility();
      });
    });
  }

  initFilterPanel() {
    if (!this.filterToggleButton || !this.filtersPanel) return;

    const labelOpen = this.filterToggleButton.dataset.labelOpen || "Show filter";
    const labelClose = this.filterToggleButton.dataset.labelClose || "Close filter";

    const setFilterPanelState = (isOpen) => {
      this.filtersPanel.classList.toggle("active", isOpen);
      this.filterToggleButton.setAttribute("aria-expanded", String(isOpen));
      this.filterToggleButton.classList.toggle("active", isOpen);
      this.filterToggleButton.textContent = isOpen ? labelClose : labelOpen;

      const existingSvg = this.filterToggleButton.querySelector("svg");
      if (existingSvg) existingSvg.remove();

      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      arrow.setAttribute("width", "16");
      arrow.setAttribute("height", "16");
      arrow.setAttribute("viewBox", "0 0 16 16");
      arrow.setAttribute("fill", "none");
      arrow.innerHTML =
        '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      this.filterToggleButton.appendChild(arrow);

      if (!isOpen) {
        this.hideLocationsList();
      }
    };

    this.filterToggleButton.addEventListener("click", () => {
      const isOpen = !this.filtersPanel.classList.contains("active");
      setFilterPanelState(isOpen);
    });

    document.addEventListener("click", (event) => {
      if (!this.filtersPanel.classList.contains("active")) return;

      const target = event.target;
      const isClickInsidePanel = this.filtersPanel.contains(target);
      const isClickOnToggle = this.filterToggleButton.contains(target);
      const locationsList = this.root.querySelector(".mapbox-block__locations-list");
      const isClickInsideLocationsList = locationsList?.contains(target);

      if (!isClickInsidePanel && !isClickOnToggle && !isClickInsideLocationsList) {
        setFilterPanelState(false);
      }
    });
  }

  showLocationsList(categoryMarkers, category) {
    const listPanel = this.root.querySelector(".mapbox-block__locations-list");
    const listInner = this.root.querySelector(".mapbox-block__locations-list-inner");

    listInner.querySelectorAll(`[data-category="${category}"]`).forEach((el) => el.remove());

    const fragment = document.createDocumentFragment();
    categoryMarkers.forEach((marker, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mapbox-location-item";
      btn.dataset.category = category;
      btn.innerHTML = `<img src="${marker.icon}" alt="${marker.type}" /><span>${marker.title || this.getTypeLabel(marker.type)}</span>`;

      btn.addEventListener("click", () => {
        this.hideLocationsList();
        this.activateMarker(marker, { focusMap: true });
      });

      fragment.appendChild(btn);
    });

    listInner.appendChild(fragment);
    listPanel.classList.add("active");
  }

  removeFromLocationsList(category) {
    const listInner = this.root.querySelector(".mapbox-block__locations-list-inner");
    listInner.querySelectorAll(`[data-category="${category}"]`).forEach((el) => el.remove());

    if (!listInner.children.length) {
      this.hideLocationsList();
    }
  }

  hideLocationsList({ clearFilters = false } = {}) {
    this.root.querySelector(".mapbox-block__locations-list")?.classList.remove("active");

    const listInner = this.root.querySelector(".mapbox-block__locations-list-inner");
    if (listInner) listInner.innerHTML = "";

    if (clearFilters) {
      this.root.querySelectorAll(".mapbox-filter-button").forEach((btn) => {
        btn.classList.remove("selected");
      });

      this.activeFilters.clear();
      this.updateMarkerVisibility();
    }
  }

  _deselectFilter(category) {
    const btn = this.root.querySelector(`.mapbox-filter-button[data-filter="${category}"]`);
    if (btn) btn.classList.remove("selected");
    this.activeFilters.delete(category);
    this.updateMarkerVisibility();
  }

  addTerrainAndSky() {
    if (!this.map.getSource("mapbox-dem")) {
      this.map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.terrain-rgb",
        tileSize: 512,
        maxzoom: 14,
      });
      this.map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });
    }

    if (!this.map.getLayer("sky")) {
      this.map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 0.0],
          "sky-atmosphere-sun-intensity": 15,
        },
      });
    }
  }

  add3DBuildings() {
    const layers = this.map.getStyle().layers || [];
    const labelLayerId = layers.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;

    if (!this.map.getLayer("add-3d-buildings")) {
      this.map.addLayer(
        {
          id: "add-3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#d2b48c",
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
            "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
            "fill-extrusion-opacity": 1.0,
          },
        },
        labelLayerId,
      );
    }
  }

  addRouteSource() {
    if (this.map.getSource(this.routeSourceId)) return;

    this.map.addSource(this.routeSourceId, {
      type: "geojson",
      lineMetrics: true,
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });

    this.map.addLayer({
      id: this.routeLayerId,
      type: "line",
      source: this.routeSourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#00008B",
        "line-width": 5,
        "line-opacity": 0.85,
      },
    });
  }

  addMarkers() {
    if (!this.markers.length) return;

    const mainMarker = this.getMainMarker();

    this.markers.forEach((marker, index) => {
      const [lng, lat] = marker.coordinates || [marker.lng, marker.lat] || [0, 0];
      const markerElement = document.createElement("div");
      markerElement.className = `mapbox-marker mapbox-marker--${marker.type}`;
      markerElement.innerHTML = `<img src="${marker.icon}" alt="${marker.type}" />`;

      // Hidden initial state for sequential appearance
      markerElement.style.opacity = "0";

      const mapMarker = new mapboxgl.Marker(markerElement).setLngLat([lng, lat]).addTo(this.map);
      markerElement.addEventListener("click", () => this.onMarkerClick(marker));
      this.markerInstances.push({ marker, mapMarker, markerElement });

      // Sequential appearance: starts 0.5s after the intro orbit finishes (~4500ms)
      const delay = 4500 + index * 130;
      setTimeout(() => {
        markerElement.style.opacity = "1";
      }, delay);

      if (mainMarker === marker) {
        this.map.setCenter([lng, lat]);
      }
    });
  }

  updateMarkerVisibility() {
    this.markerInstances.forEach(({ marker, markerElement }) => {
      // Main marker is always visible
      if (marker.type === "main") {
        markerElement.style.display = "block";
      } else {
        const shouldShow = this.activeFilters.size === 0 || this.activeFilters.has(marker.type);
        markerElement.style.display = shouldShow ? "block" : "none";
      }
    });
  }

  getMainMarker() {
    return this.markers.find((marker) => marker.type === "main") || this.markers[0];
  }

  async activateMarker(marker, { focusMap = true } = {}) {
    // Remove pulse effect from previous marker
    if (this.currentMarker) {
      const prevMarkerInstance = this.markerInstances.find((m) => m.marker === this.currentMarker);
      if (prevMarkerInstance) {
        const pulse = prevMarkerInstance.markerElement.querySelector(".mapbox-pulse-effect");
        if (pulse) pulse.remove();
      }
    }

    if (focusMap) {
      const [lng, lat] = marker.coordinates || [marker.lng, marker.lat] || [0, 0];
      this.map.flyTo({
        center: [lng, lat],
        zoom: Math.max(this.zoom, 15),
        speed: 0.8,
        pitch: 50,
        bearing: 0,
      });
    }

    this.showInfoPanel(marker);
    // Single source of truth: route distance comes from API (cached after first request)
    const routeDistance = await this.drawRouteTo(marker);
    this.addPulseEffect(marker, routeDistance);
  }

  async onMarkerClick(marker) {
    await this.activateMarker(marker, { focusMap: true });
  }

  showInfoPanel(marker) {
    if (this.isAnimatingRoute) {
      this.isAnimatingRoute = false;
      this.map.stop?.();
    }

    this.currentMarker = marker;
    this.infoTitle.textContent = marker.title || this.getMarkerTitle(marker);
    this.infoSubtitle.innerHTML = marker.description || "";
    this.updateGallery(marker.images || []);
    this.resetTravelFields();

    // Add "Drive Along Route" button only for non-main markers
    // this.infoPanel.querySelectorAll(".mapbox-drive-route-btn").forEach((btn) => btn.remove());
    this.infoPanel.querySelectorAll(".mapbox-google-maps-btn").forEach((btn) => btn.remove());

    // if (marker.type !== "main") {
    //   const driveBtn = document.createElement("button");
    //   driveBtn.className = "mapbox-drive-route-btn";
    //   driveBtn.textContent = this.i18n.t("Map.location.driveRoute");

    //   const stopBtn = document.createElement("button");
    //   stopBtn.className = "mapbox-drive-route-btn mapbox-stop-route-btn";
    //   stopBtn.textContent = this.i18n.t("Map.location.stopRoute");
    //   stopBtn.style.display = "none";

    //   driveBtn.addEventListener("click", () => {
    //     this.animateAlongRoute(stopBtn, driveBtn);
    //   });

    //   stopBtn.addEventListener("click", () => {
    //     this.stopRouteAnimation(stopBtn, driveBtn);
    //   });

    //   this.infoPanel.appendChild(driveBtn);
    //   this.infoPanel.appendChild(stopBtn);
    // }

    if (marker.type !== "main") {
      const mainMarker = this.getMainMarker();
      const [originLng, originLat] = mainMarker.coordinates || [mainMarker.lng, mainMarker.lat];
      const [destLng, destLat] = marker.coordinates || [marker.lng, marker.lat];

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;

      const googleMapsBtn = document.createElement("a");
      googleMapsBtn.className = "mapbox-google-maps-btn";
      googleMapsBtn.href = googleMapsUrl;
      googleMapsBtn.target = "_blank";
      googleMapsBtn.rel = "noopener noreferrer";
      googleMapsBtn.textContent = this.i18n.t("Map.location.openInGoogleMaps") || "Open in Google Maps";

      this.infoPanel.appendChild(googleMapsBtn);
    }

    this.infoPanel.classList.add("active");
  }

  stopRouteAnimation(stopBtn, driveBtn) {
    this.isAnimatingRoute = false;

    if (stopBtn) stopBtn.style.display = "none";
    if (driveBtn) driveBtn.style.display = "";

    if (this.infoPanel && this.currentMarker) {
      this.infoPanel.classList.add("active");
    }

    this.map.easeTo({
      pitch: 45,
      bearing: -20,
      zoom: this.zoom,
      duration: 1000,
    });
  }

  hideInfoPanel() {
    this.infoPanel.classList.remove("active");
    this._destroySliderSafely();
  }

  getMarkerTitle(marker) {
    if (marker.title) return marker.title;
    return this.getTypeLabel(marker.type);
  }

  updateGallery(images) {
    this._destroySliderSafely();

    this.galleryWrapper.innerHTML = "";

    if (!images || !images.length) {
      this.galleryWrapper.innerHTML = `
        <div class="swiper-slide mapbox-info__empty-slide">${this.i18n.t("Map.location.noPhotos") || "No photos available"}</div>
      `;
      return;
    }

    const galleryTitle = this.getMarkerTitle(this.currentMarker || {});
    images.forEach((src) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      slide.innerHTML = `<img src="${src}" alt="${galleryTitle}" loading="lazy"/>`;
      this.galleryWrapper.appendChild(slide);
    });

    const swiperContainer = this.root
      ? this.root.querySelector(".mapbox-block__info-gallery.swiper")
      : document.querySelector(".mapbox-block__info-gallery.swiper");

    if (swiperContainer) {
      this.sliderInstance = new Swiper(swiperContainer, {
        slidesPerView: 1,
        navigation: {
          nextEl: ".mapbox-info__swiper-next",
          prevEl: ".mapbox-info__swiper-prev",
        },
      });
    }
  }

  resetTravelFields() {
    Object.values(this.travelFields).forEach((field) => {
      field.textContent = "--";
    });
  }

  fitRouteInView(start, end, routeCoordinates = []) {
    const bounds = new mapboxgl.LngLatBounds();

    const safeRouteCoordinates = Array.isArray(routeCoordinates) ? routeCoordinates : [];
    if (safeRouteCoordinates.length) {
      safeRouteCoordinates.forEach((point) => {
        if (Array.isArray(point) && point.length >= 2) {
          bounds.extend(point);
        }
      });
    }

    if (bounds.isEmpty()) {
      bounds.extend(start).extend(end);
    }

    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024;
    const currentBearing = this.map.getBearing();
    const currentPitch = this.map.getPitch();
    const targetPitch = Math.max(currentPitch, 38);

    this.map.fitBounds(bounds, {
      padding: isMobile
        ? { top: 80, bottom: 200, left: 40, right: 40 }
        : isTablet
          ? { top: 100, bottom: 300, left: 60, right: 60 }
          : { top: 100, bottom: 100, left: 100, right: 400 },
      bearing: currentBearing,
      pitch: targetPitch,
      duration: 1200,
    });
  }

  async drawRouteTo(destination) {
    const origin = this.getMainMarker();
    if (!origin || origin === destination) {
      this.clearRoute();
      return 0;
    }

    const start = origin.coordinates || [origin.lng, origin.lat];
    const end = destination.coordinates || [destination.lng, destination.lat];

    // Create cache key
    const cacheKey = `${start[0]},${start[1]}-${end[0]},${end[1]}`;

    // Check if route is cached
    if (this.routeCache[cacheKey]) {
      const cached = this.routeCache[cacheKey];
      this.routeCoordinates = cached.coordinates || [];
      this.fitRouteInView(start, end, this.routeCoordinates);
      this.updateRoute({
        type: "Feature",
        geometry: {
          coordinates: cached.coordinates,
          type: "LineString",
        },
        properties: {},
      });
      this.animateRouteLineDrawing(cached.coordinates);

      // Update travel fields from cache
      cached.durations.forEach(({ field, duration }) => {
        this.travelFields[field].textContent = duration
          ? this.formatDuration(Math.round(duration / 60)) // ? `${Math.round(duration / 60)} ${this.i18n.t("Map.location.minutes")}`
          : "—";
      });

      // Update route color from cache
      this.updateRouteColor(cached.color);
      return cached.distance;
    }

    // Fetch routes for all profiles
    const routeRequests = [
      { profile: "driving", field: "driving" },
      { profile: "walking", field: "walking" },
      { profile: "cycling", field: "cycling" },
    ].map(({ profile, field }) =>
      this.fetchRoute(profile, start, end)
        .then((response) => ({ field, response }))
        .catch(() => ({ field, response: null })),
    );

    const results = await Promise.all(routeRequests);
    const routeResult = results.find((res) => res.response && res.response.geometry);
    const routeFeature = routeResult?.response?.geometry;
    const routeDistance = routeResult?.response?.distance / 1000 || 0; // Convert to km
    // Update travel fields
    const durations = [];
    results.forEach(({ field, response }) => {
      const duration = response?.duration;
      this.travelFields[field].textContent = duration
        ? this.formatDuration(Math.round(duration / 60)) // `${Math.round(duration / 60)} ${this.i18n.t("Map.location.minutes")}`
        : "—";
      durations.push({ field, duration });
    });

    if (routeFeature) {
      // Store coordinates for route animation
      this.routeCoordinates = routeFeature.coordinates || [];
      const routeColor = this.getRouteColor(routeDistance);
      this.fitRouteInView(start, end, this.routeCoordinates);

      // Cache the route data
      this.routeCache[cacheKey] = {
        coordinates: this.routeCoordinates,
        color: routeColor,
        durations: durations,
        distance: routeDistance,
      };

      this.updateRoute({
        type: "Feature",
        geometry: routeFeature,
        properties: {},
      });
      this.updateRouteColor(routeColor);
      this.animateRouteLineDrawing(this.routeCoordinates);
      return routeDistance;
    } else {
      this.clearRoute();
      this.routeCoordinates = [];
      return 0;
    }
  }

  formatDuration(minutes) {
    if (minutes < 60) return `${minutes} ${this.i18n.t("Map.location.minutes")}`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hLabel = this.i18n.t("Map.location.hours");
    const mLabel = this.i18n.t("Map.location.minutes");
    return m > 0 ? `${h} ${hLabel} ${m} ${mLabel}` : `${h} ${hLabel}`;
  }

  animateRouteLineDrawing(coordinates) {
    if (!this.map.getLayer(this.routeLayerId) || !coordinates || coordinates.length === 0) return;
    this.stopRouteFlowAnimation(false);

    const totalDuration = 900; // Faster line drawing animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Calculate how many coordinates to show
      const coordsToShow = Math.ceil(coordinates.length * progress);
      const visibleCoords = coordinates.slice(0, coordsToShow);

      // Update route source with visible coordinates
      const routeSource = this.map.getSource(this.routeSourceId);
      if (routeSource) {
        routeSource.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: visibleCoords,
              },
              properties: {},
            },
          ],
        });
      }

      // Animate opacity
      if (this.map.getLayer(this.routeLayerId)) {
        this.map.setPaintProperty(this.routeLayerId, "line-opacity", 0.3 + 0.55 * progress);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - set to full opacity
        if (this.map.getLayer(this.routeLayerId)) {
          this.map.setPaintProperty(this.routeLayerId, "line-opacity", 0.85);
        }
        this.startRouteFlowAnimation();
      }
    };

    animate();
  }

  calculateDistance(start, end) {
    const [lng1, lat1] = start;
    const [lng2, lat2] = end;

    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  getRouteColor() {
    return "#00008B";
  }

  updateRouteColor(color) {
    this.routeBaseColor = color;
    if (this.map.getLayer(this.routeLayerId)) {
      this.map.setPaintProperty(this.routeLayerId, "line-color", color);
      // this.applyRouteFlowGradient(this.routeFlowPhase);
    }
  }

  hexToRgba(hex, alpha = 1) {
    const safeHex = (hex || "").replace("#", "");
    const normalized =
      safeHex.length === 3
        ? safeHex
            .split("")
            .map((ch) => ch + ch)
            .join("")
        : safeHex;

    if (normalized.length !== 6) {
      return `rgba(66, 100, 251, ${alpha})`;
    }

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  applyRouteFlowGradient(phase = 0) {
    if (!this.map?.getLayer(this.routeLayerId)) return;

    const baseColor = this.routeBaseColor || "#00008B";
    const glowColor = this.hexToRgba(baseColor, 0.55);
    const highlightColor = "#FFFFFF";
    const trail = 0.07;
    const fade = 0.18;

    const p0 = Math.max(0, phase - fade);
    const p1 = Math.max(0, phase - trail);
    const p2 = Math.min(1, phase + trail);
    const p3 = Math.min(1, phase + fade);

    this.map.setPaintProperty(this.routeLayerId, "line-gradient", [
      "interpolate",
      ["linear"],
      ["line-progress"],
      0,
      baseColor,
      p0,
      baseColor,
      p1,
      glowColor,
      phase,
      highlightColor,
      p2,
      glowColor,
      p3,
      baseColor,
      1,
      baseColor,
    ]);
  }

  startRouteFlowAnimation() {
    if (!this.map?.getLayer(this.routeLayerId)) return;
    this.stopRouteFlowAnimation(false);

    const speed = 0.0035;
    const animateFlow = () => {
      if (!this.map?.getLayer(this.routeLayerId)) {
        this.stopRouteFlowAnimation(false);
        return;
      }

      this.routeFlowPhase += speed;
      if (this.routeFlowPhase > 1) {
        this.routeFlowPhase = 0;
      }

      // this.applyRouteFlowGradient(this.routeFlowPhase);
      this.routeFlowAnimationFrame = requestAnimationFrame(animateFlow);
    };

    this.routeFlowAnimationFrame = requestAnimationFrame(animateFlow);
  }

  stopRouteFlowAnimation(resetPaint = true) {
    if (this.routeFlowAnimationFrame) {
      cancelAnimationFrame(this.routeFlowAnimationFrame);
      this.routeFlowAnimationFrame = null;
    }

    if (resetPaint && this.map?.getLayer(this.routeLayerId)) {
      this.map.setPaintProperty(this.routeLayerId, "line-gradient", [
        "interpolate",
        ["linear"],
        ["line-progress"],
        0,
        this.routeBaseColor,
        1,
        this.routeBaseColor,
      ]);
    }
  }

  async fetchRoute(profile, start, end) {
    const [startLng, startLat] = start;
    const [endLng, endLat] = end;
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Mapbox API error: ${response.status}`, url);
        throw new Error(`Route API returned ${response.status}`);
      }
      const data = await response.json();
      const route = data.routes?.[0];
      if (!route) throw new Error("No route found in response");
      return {
        geometry: route.geometry,
        duration: route.duration,
        distance: route.distance || 0,
      };
    } catch (error) {
      console.error("fetchRoute error:", error);
      throw error;
    }
  }

  updateRoute(feature) {
    const routeSource = this.map.getSource(this.routeSourceId);
    if (routeSource) {
      routeSource.setData({
        type: "FeatureCollection",
        features: [feature],
      });
    }
  }

  clearRoute() {
    this.stopRouteFlowAnimation();
    const routeSource = this.map.getSource(this.routeSourceId);
    if (routeSource) {
      routeSource.setData({ type: "FeatureCollection", features: [] });
    }
  }

  fitToMarkers() {
    if (!this.markers.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    this.markers.forEach(({ coordinates = [], lng, lat }) => {
      const point = coordinates.length ? coordinates : [lng, lat];
      bounds.extend(point);
    });

    if (bounds.isEmpty()) return;
    // this.map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 1000 });
    // this.map.once('moveend', () => {
    //   if (this.map) {
    //     this.map.setPitch(45);
    //   }
    // });
  }

  initCameraOrbit() {
    const mainMarker = this.getMainMarker();
    const center = mainMarker ? mainMarker.coordinates || [mainMarker.lng, mainMarker.lat] : this.center;

    // Phase 1 start: flat overhead view, zoomed out, rotated 140° away from final bearing
    this.map.jumpTo({
      center,
      zoom: this.zoom - 4,
      bearing: 140,
      pitch: 0,
    });

    // Phase 1: sweep down and zoom in while rotating immediately on init
    this.map.easeTo({
      center,
      zoom: this.zoom - 0.5,
      bearing: 20,
      pitch: 55,
      duration: 2400,
      easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    });

    // Phase 2: settle into final resting position
    setTimeout(() => {
      this.map.easeTo({
        center,
        zoom: this.zoom,
        bearing: -20,
        pitch: 45,
        duration: 1400,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
    }, 2600);
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this._destroySliderSafely();
  }

  _destroySliderSafely() {
    if (!this.sliderInstance) return;

    // Приводимо до масиву за допомогою Array.from, щоб обробити і колекції, і одиничні об'єкти
    const instances =
      this.sliderInstance.length !== undefined ? Array.from(this.sliderInstance) : [this.sliderInstance];

    instances.forEach((slider) => {
      if (slider && typeof slider.destroy === "function") {
        try {
          slider.destroy(true, true);
        } catch (e) {
          console.error("Swiper destroy error:", e);
        }
      }
    });

    this.sliderInstance = null;
  }

  fitToCategoryMarkers(categoryMarkers, markerToActivate = null) {
    if (!categoryMarkers?.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    categoryMarkers.forEach((marker) => {
      const coords = marker.coordinates || [marker.lng, marker.lat];
      bounds.extend(coords);
    });

    if (bounds.isEmpty()) return;

    const isMobile = window.innerWidth <= 900;
    this.map.fitBounds(bounds, {
      padding: isMobile
        ? { top: 90, right: 40, bottom: 150, left: 40 }
        : { top: 100, right: 120, bottom: 120, left: 120 },
      maxZoom: isMobile ? 15 : 16,
      duration: 1200,
      bearing: this.map.getBearing(),
      pitch: Math.max(this.map.getPitch(), 38),
    });

    if (markerToActivate) {
      this.map.once("moveend", () => {
        this.activateMarker(markerToActivate, { focusMap: false });
      });
    }
  }

  flyToCategoryMarker(category) {
    const categoryMarkers = this.markers.filter((m) => m.type === category);
    if (!categoryMarkers.length) return;

    if (categoryMarkers.length === 1) {
      const markerToActivate = categoryMarkers[0];
      this.fitToCategoryMarkers(categoryMarkers, markerToActivate);
    } else {
      this.fitToCategoryMarkers(categoryMarkers);
    }
  }

  // Legacy alias for compatibility with older integrations
  fitToCategoryAndActivateNearest(categoryMarkers, nearestMarker) {
    const markerToActivate = nearestMarker || categoryMarkers?.[0] || null;
    this.fitToCategoryMarkers(categoryMarkers, markerToActivate);
  }

  orbitCamera(center, distance = 0, options = {}) {
    const categoryMarkers = options?.categoryMarkers || [];
    const markerToActivate = options?.nearestMarker || null;

    if (categoryMarkers.length) {
      this.fitToCategoryMarkers(categoryMarkers, markerToActivate);
      return;
    }

    if (center) {
      this.map.easeTo({
        center,
        duration: 1200,
        bearing: this.map.getBearing(),
        pitch: Math.max(this.map.getPitch(), 38),
      });
    }
  }

  /*
  Previous orbit and nearest-pin implementation was replaced with direct
  category fit logic to avoid cinematic camera movement and nearest selection.
  */

  addPulseEffect(marker, distance = 0) {
    // Find marker element for the selected marker
    const markerInstance = this.markerInstances.find((m) => m.marker === marker);
    if (!markerInstance) return;

    const markerElement = markerInstance.markerElement;

    // Remove existing pulse if any
    const existingPulse = markerElement.querySelector(".mapbox-pulse-effect");
    if (existingPulse) existingPulse.remove();

    // Determine color class based on distance
    let colorClass = "mapbox-pulse-effect--green"; // default
    // if (distance <= 0.5) {
    //   colorClass = "mapbox-pulse-effect--green";
    // } else if (distance <= 2) {
    //   colorClass = "mapbox-pulse-effect--yellow";
    // }

    // Create pulse element
    const pulse = document.createElement("div");
    pulse.className = `mapbox-pulse-effect ${colorClass}`;
    markerElement.appendChild(pulse);
  }

  animateAlongRoute(stopBtn, driveBtn) {
    if (this.isAnimatingRoute || this.routeCoordinates.length === 0) return;
    this.isAnimatingRoute = true;

    if (stopBtn) stopBtn.style.display = "";
    if (driveBtn) driveBtn.style.display = "none";

    let coordinates = this.routeCoordinates;
    const initialZoom = this.map.getZoom();
    const initialPitch = this.map.getPitch();
    const initialBearing = this.map.getBearing();

    // Calculate route length in kilometers using calculateDistance for each segment
    const routeLength = coordinates.reduce((sum, current, index) => {
      if (index === 0) return 0;
      return sum + this.calculateDistance(coordinates[index - 1], current);
    }, 0);

    // Slower animation duration calculation
    // Base time 4 seconds + 0.8 seconds per km for slower progression
    const baseDuration = 2000;
    const durationPerKm = 5000; // 800ms per km (slower)
    const duration = Math.min(baseDuration + routeLength * durationPerKm, 30000); // max 30 seconds

    // Calculate point count based on route length for smoother travel animation
    // Higher density helps camera movement feel less stepped on short and medium routes
    const targetPointCount = Math.min(2600, Math.max(700, Math.floor(routeLength * 260)));

    const startTime = Date.now();
    let smoothedBearing = initialBearing;
    let smoothedCenter = coordinates[0];

    // Interpolate coordinates for smoother animation
    coordinates = this.interpolateCoordinates(coordinates, targetPointCount);

    // Easing function for smoother acceleration/deceleration
    const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

    // Keep angle interpolation stable around -180/180 wrap
    const normalizeAngle = (angle) => {
      let a = angle % 360;
      if (a > 180) a -= 360;
      if (a < -180) a += 360;
      return a;
    };

    const shortestAngleDelta = (from, to) => normalizeAngle(to - from);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutSine(progress);

      // Get position along route (using more points)
      const index = Math.min(Math.floor(easedProgress * (coordinates.length - 1)), coordinates.length - 1);
      const [lng, lat] = coordinates[index];

      // Calculate bearing with look-ahead and smooth interpolation to reduce sharp turns
      let targetBearing = smoothedBearing;
      if (index < coordinates.length - 1) {
        const lookAheadIndex = Math.min(index + 14, coordinates.length - 1);
        const [nextLng, nextLat] = coordinates[lookAheadIndex];
        targetBearing = (Math.atan2(nextLng - lng, nextLat - lat) * 180) / Math.PI;
      }

      const bearingDelta = shortestAngleDelta(smoothedBearing, targetBearing);
      smoothedBearing = normalizeAngle(smoothedBearing + bearingDelta * 0.12);

      // Smooth center interpolation to reduce jitter on tight geometry
      smoothedCenter = [
        smoothedCenter[0] + (lng - smoothedCenter[0]) * 0.18,
        smoothedCenter[1] + (lat - smoothedCenter[1]) * 0.18,
      ];

      // Moderate zoom during travel
      const zoom = initialZoom + 2;

      // Per-frame camera update without queued transitions
      this.map.jumpTo({
        center: smoothedCenter,
        bearing: smoothedBearing,
        pitch: 80,
        zoom: zoom,
      });

      if (progress < 1 && this.isAnimatingRoute) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimatingRoute = false;

        if (stopBtn) stopBtn.style.display = "none";
        if (driveBtn) driveBtn.style.display = "";

        // Smoothly return to normal view with easing
        this.map.easeTo({
          pitch: initialPitch,
          bearing: initialBearing,
          zoom: initialZoom,
          duration: 1200,
        });
      }
    };

    animate();
  }

  interpolateCoordinates(coordinates, targetCount) {
    if (coordinates.length >= targetCount) return coordinates;

    const interpolated = [];
    const step = (coordinates.length - 1) / (targetCount - 1);

    for (let i = 0; i < targetCount; i++) {
      const pos = i * step;
      const index = Math.floor(pos);
      const fraction = pos - index;

      if (index >= coordinates.length - 1) {
        interpolated.push(coordinates[coordinates.length - 1]);
      } else {
        const [lng1, lat1] = coordinates[index];
        const [lng2, lat2] = coordinates[index + 1];

        const lng = lng1 + (lng2 - lng1) * fraction;
        const lat = lat1 + (lat2 - lat1) * fraction;

        interpolated.push([lng, lat]);
      }
    }

    return interpolated;
  }
}
