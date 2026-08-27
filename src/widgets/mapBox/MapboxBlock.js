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
    const enableZoom =
      this.i18n.t("Map.location.enableZoom") +
        (window.innerWidth > 768 ? ` ${this.i18n.t("Map.location.zoomDesktop")}` : "") || "Click to Zoom";
    const disableZoom =
      this.i18n.t("Map.location.disableZoom") +
        (window.innerWidth > 768 ? ` ${this.i18n.t("Map.location.zoomDesktop")}` : "") || "Stop Zoom";
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
              <button type="button" class="mapbox-block__zoom-toggle-btn active" aria-label="Toggle scroll zoom" aria-pressed="false" data-label-open="${enableZoom}" data-label-close="${disableZoom}">
                ${enableZoom} ${window.innerWidth > 768 ? this.i18n.t("Map.location.zoomDesktop") : ""}
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M22.744 11.6621C22.7098 11.975 22.6761 12.6041 22.5888 13.1797C22.5314 13.558 22.2883 13.7987 22.0868 13.9326C21.8897 14.0636 21.6667 14.1402 21.4765 14.1885C21.2936 14.2349 21.0958 14.2644 20.9003 14.2852C20.5552 15.48 19.4571 16.3544 18.1513 16.3545C16.8996 16.3545 15.8383 15.5514 15.4481 14.4326L8.93545 14.4326C8.54538 15.5514 7.48303 16.3544 6.23135 16.3545C4.70627 16.3543 3.46256 15.1623 3.3749 13.6592L1.73721 13.0479C1.44386 12.9385 1.24899 12.6588 1.24893 12.3457L1.24893 11.1865C1.249 10.9495 1.36143 10.7264 1.55166 10.585L1.57217 10.5693L1.57217 9.65527C1.57233 9.20473 1.82624 8.89725 2.08291 8.73438C2.30868 8.59124 2.55067 8.54259 2.71572 8.53418C2.72822 8.53355 2.7413 8.53321 2.75381 8.5332L4.19033 8.5332L5.1874 7.87109L5.21475 7.85352C5.77262 7.51755 7.22136 6.84961 8.6874 6.84961L10.7138 6.84961L10.9638 6.85742C12.2471 6.9254 14.5838 7.45577 16.6415 9.14648C18.9264 9.14793 20.3982 9.47688 21.3231 9.91211C21.7876 10.1307 22.1348 10.3863 22.372 10.6602C22.5867 10.9082 22.7874 11.2653 22.744 11.6621ZM17.6356 10.6738C17.3244 10.6578 16.9886 10.6465 16.6269 10.6465L10.6933 10.6465L10.6933 10.6455C10.5939 10.6462 10.4568 10.6526 10.2724 10.6455C9.55186 10.6175 8.56661 10.5167 7.62295 10.2852C6.91893 10.1124 6.15698 9.84736 5.55166 9.42871L4.82998 9.9082C4.70713 9.98972 4.56238 10.0332 4.41494 10.0332L3.07217 10.0332L3.07217 10.9463C3.07202 11.1831 2.96035 11.4064 2.77041 11.5479L2.74893 11.5635L2.74893 11.8242L3.68838 12.1748C4.16499 11.255 5.12359 10.6252 6.23135 10.625C7.62254 10.6251 8.78139 11.6175 9.04092 12.9326L15.3417 12.9326C15.5684 11.784 16.4812 10.8839 17.6356 10.6738ZM7.59658 13.4902C7.59645 12.7367 6.9849 12.1251 6.23135 12.125C5.55436 12.1252 4.99084 12.6195 4.88467 13.2666C4.87289 13.3386 4.8671 13.4139 4.86709 13.4902C4.86725 14.2437 5.47793 14.8542 6.23135 14.8545C6.94262 14.8544 7.52794 14.3098 7.59072 13.6152C7.59439 13.5744 7.59657 13.5323 7.59658 13.4902ZM8.6874 8.34961C8.19503 8.34961 7.68468 8.45909 7.2333 8.60156C7.45992 8.68424 7.7098 8.76174 7.98037 8.82813C8.50483 8.95679 9.05395 9.03749 9.55068 9.08789L9.55068 8.34961L8.6874 8.34961ZM13.8397 9.14648C12.7498 8.63845 11.7269 8.42477 11.0507 8.36719L11.0507 9.14648L13.8397 9.14648ZM19.5165 13.4902C19.5164 12.7367 18.9048 12.1251 18.1513 12.125C17.3976 12.125 16.7871 12.7366 16.787 13.4902C16.787 13.5324 16.7882 13.5744 16.7919 13.6152C16.8547 14.3099 17.4399 14.8545 18.1513 14.8545C18.8868 14.8544 19.4874 14.2722 19.5155 13.5439C19.5162 13.5263 19.5165 13.5082 19.5165 13.4902ZM21.2382 11.6416C21.1699 11.5629 21.009 11.4223 20.6845 11.2695C20.3642 11.1188 19.9045 10.9661 19.2636 10.8496C20.0777 11.193 20.697 11.9026 20.9218 12.7715C20.9887 12.7608 21.0513 12.7486 21.1073 12.7344C21.1175 12.7317 21.1266 12.7261 21.1356 12.7236C21.1856 12.327 21.2055 11.995 21.2392 11.6436L21.2382 11.6416Z" fill="#4F307F"/>
                  </svg>
                </span>
                
                </div>
                <strong data-travel-mode="driving">--</strong>
              </div>
              <div class="mapbox-block__travel-item">
                <div class="mapbox-block__travel-head">
                <span class="mapbox-block__travel-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M10.6504 16.0002C10.6503 17.7673 9.21735 19.2002 7.4502 19.2003C5.68306 19.2002 4.25011 17.7673 4.25 16.0002C4.25001 14.2329 5.683 12.8001 7.4502 12.8C9.21741 12.8001 10.6504 14.2329 10.6504 16.0002ZM9.15039 16.0002C9.15038 15.0613 8.38899 14.3001 7.4502 14.3C6.51143 14.3001 5.75001 15.0614 5.75 16.0002C5.75011 16.9389 6.51149 17.7002 7.4502 17.7003C8.38893 17.7002 9.15029 16.9389 9.15039 16.0002ZM16.25 11.4503C16.2498 11.8644 15.9141 12.2003 15.5 12.2003L14.0996 12.2003C13.8491 12.2001 13.6146 12.0748 13.4756 11.8664L12.5156 10.4259L11.041 11.5304L12.5303 13.0197C12.6709 13.1603 12.75 13.351 12.75 13.55L12.75 16.0002C12.7499 16.4143 12.4141 16.7502 12 16.7502C11.586 16.75 11.2501 16.4142 11.25 16.0002L11.25 13.8605L9.37012 11.9806C9.21646 11.8269 9.13694 11.6134 9.15234 11.3966C9.1678 11.1799 9.2764 10.9802 9.4502 10.8498L12.25 8.75015L12.3135 8.70718C12.4665 8.61516 12.6485 8.58025 12.8262 8.6105C13.0293 8.6453 13.2099 8.76232 13.3242 8.93375L14.501 10.7003L15.5 10.7003C15.9142 10.7003 16.25 11.0361 16.25 11.4503ZM15.5498 7.25015C15.5497 8.05088 14.9004 8.70035 14.0996 8.70035C13.3493 8.70003 12.7316 8.12939 12.6572 7.39859L12.6504 7.25015L12.6572 7.10172C12.7314 6.37073 13.3491 5.80028 14.0996 5.79996C14.9004 5.79996 15.5498 6.44934 15.5498 7.25015ZM19.75 16.0002C19.7499 17.7674 18.3171 19.2003 16.5498 19.2003C14.7828 19.2001 13.3497 17.7672 13.3496 16.0002C13.3496 14.233 14.7827 12.8002 16.5498 12.8C18.3171 12.8 19.75 14.2328 19.75 16.0002ZM14.1465 7.23062C14.1414 7.21854 14.1312 7.20932 14.1191 7.20425L14.0996 7.20035C14.0723 7.20069 14.0498 7.22276 14.0498 7.25015L14.0537 7.26968C14.0613 7.28737 14.0792 7.29971 14.0996 7.29996C14.1203 7.29996 14.1389 7.28755 14.1465 7.26968L14.1504 7.25015L14.1465 7.23062ZM18.25 16.0002C18.25 15.0613 17.4887 14.3 16.5498 14.3C15.6111 14.3002 14.8496 15.0614 14.8496 16.0002C14.8497 16.9388 15.6112 17.7001 16.5498 17.7003C17.4886 17.7003 18.2499 16.9389 18.25 16.0002Z" fill="#4F307F"/>
                  </svg>
                </span>
                
                </div>
                <strong data-travel-mode="cycling">--</strong>
              </div>
              <div class="mapbox-block__travel-item">
                <div class="mapbox-block__travel-head">
                <span class="mapbox-block__travel-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M17.7998 11.1357C17.7998 11.5775 17.4418 11.9365 17 11.9365C14.6515 11.9365 13.1118 11.2219 12.3926 10.1865C12.3098 11.1027 12.1772 11.9486 12.0234 12.6924C13.7424 14.2141 14.9241 16.3123 15.335 18.7773C15.4075 19.2131 15.1125 19.6256 14.6768 19.6982C14.2411 19.7707 13.8285 19.4757 13.7559 19.04C13.4558 17.2404 12.6812 15.6921 11.5664 14.4844C11.4306 14.9251 11.3001 15.2839 11.1895 15.542C11.1833 15.5564 11.1769 15.571 11.1699 15.585C10.333 17.2588 9.46912 18.5709 8.56543 19.4746C8.25307 19.7867 7.74693 19.7867 7.43457 19.4746C7.12217 19.1622 7.1222 18.6552 7.43457 18.3428C8.16269 17.6145 8.92952 16.4809 9.72363 14.8975C9.88373 14.5203 10.1333 13.7929 10.3594 12.8135C10.5953 11.7913 10.8001 10.5161 10.8613 9.1084C10.4917 9.15062 10.1345 9.24237 9.82422 9.44922C9.3563 9.76121 8.79982 10.4781 8.79981 12.3633C8.79975 12.8051 8.44179 13.1631 8 13.1631C7.55821 13.1631 7.20025 12.8051 7.2002 12.3633C7.20021 10.158 7.87057 8.82897 8.93652 8.11816C9.93262 7.4541 11.096 7.47265 11.6816 7.47266C11.9462 7.47266 12.2166 7.50491 12.4717 7.6123C12.7434 7.72676 12.9409 7.9023 13.0889 8.09961C13.222 8.27717 13.316 8.47561 13.3867 8.62988C13.4667 8.8045 13.5308 8.95322 13.625 9.1416C13.8375 9.56651 14.6822 10.3359 17 10.3359C17.4417 10.3359 17.7996 10.6941 17.7998 11.1357ZM13.5 5.25C13.5 5.94169 12.9417 6.5 12.25 6.5C11.5583 6.5 11 5.94173 11 5.25C11 4.55831 11.5583 4 12.25 4C12.9417 4 13.5 4.55827 13.5 5.25Z" fill="#4F307F"/>
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
        zoomToggleBtn.classList.toggle("active", !isEnabled);
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
      this.add3DBuildings();
      this.addRouteSource();
      this.addMarkers();
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
          minzoom: 14,
          paint: {
            "fill-extrusion-color": "#d2b48c",
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.05, ["get", "height"]],
            "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.05, ["get", "min_height"]],
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
