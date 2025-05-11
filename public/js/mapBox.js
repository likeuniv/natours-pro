/* eslint-disable */

export const displayMap = (locations) => {
   mapboxgl.accessToken = `pk.eyJ1IjoicG9vamE1ODQyMCIsImEiOiJjbTlqdHM4Z3EwNm96MnVzYnphenJscjYzIn0.uzkoP7ya8L0q6qaP3A6gNA`;

   var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/pooja58420/cm9ju7ni400ur01qu4za9fpae',
      scrollZoom: false,
      // center: [-118.113491, 34.111745],
      // zoom: 4,
      // interative: false,
   });

   const bounds = new mapboxgl.LngLatBounds();

   locations.forEach((loc) => {
      //create marker
      const el = document.createElement('div');
      el.className = 'marker';

      //Add marker
      new mapboxgl.Marker({
         element: el,
         anchor: 'bottom',
      })
         .setLngLat(loc.coordinates)
         .addTo(map);

      //Add pop-up
      new mapboxgl.Popup({
         offset: 30,
      })
         .setLngLat(loc.coordinates)
         .setHTML(`<p>Day-${loc.day}: ${loc.description}</p>`)
         .addTo(map);

      //Extend map bounds to include current location
      bounds.extend(loc.coordinates);
   });

   map.fitBounds(bounds, {
      padding: {
         top: 200,
         bottom: 150,
         left: 100,
         right: 100,
      },
   });
};
