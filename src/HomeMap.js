import React, { useEffect, useState } from "react";
import { v4 } from "uuid";
import _ from "lodash";

import OpenMap from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Cluster from "ol/source/Cluster";
import Overlay from "ol/Overlay";
import OSM from "ol/source/OSM";
import GeoJSON from "ol/format/GeoJSON";
import {
  defaults as defaultControls,
  ScaleLine
} from "ol/control";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import {
  singleClick
} from "ol/events/condition";
import Select from "ol/interaction/Select";
import gares from "./db/perimetre";
import "ol/ol.css";

export default function Map() {
  const [id] = useState(v4());
  useEffect(
    () => {
      const scaleLineControl = new ScaleLine();
      const layer = new TileLayer({
        preload: Infinity,
        zIndex: 1,
        source: new OSM({
          //url: "https://{a-c}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=48d81b7fb20f49dea236e387d77806e3"
          url:
            "https://{a-c}.tiles.mapbox.com/v4/opendatasoft.b3tvxj83/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib3BlbmRhdGFzb2Z0IiwiYSI6ImNpamw0eGRhNDAwMDl2eGx4anBscW1jZmgifQ.vF6hSMVMeJDwH6e_jfobpA"
        })
      });

      const clusterSource = new Cluster({
        distance: 0,
        source: new VectorSource({
          features: new GeoJSON().readFeatures(gares, {
            featureProjection: "EPSG:3857"
          })
        })
      });

      let styleCache = {};
      const vectorLayer = new VectorLayer({
        zIndex: 10,
        projection: "EPSG:3857",
        source: clusterSource,
        /*style: function(feature) {
          return styles[feature.getGeometry().getType()];
        }*/
        style: function (feature) {
          //let size = feature.get("features").length;
          let size = _.uniqBy(feature.get("features"), o => {
            return o.get("codifligne_line_id");
          }).length;
          //map.updateSize();
          let style = styleCache[size];
          if (!style) {
            style = new Style({
              image: new CircleStyle({
                radius: 8,
                fill: new Fill({ color: "orange" }),
                stroke: new Stroke({
                  color: [255, 0, 0],
                  width: 1
                })
              }),
              text: new Text({
                text: size.toString(),
                fill: new Fill({
                  color: "black"
                })
              })
            });
            styleCache[size] = style;
          }
          return style;
        }
      });

      const map = new OpenMap({
        target: id,
        controls: defaultControls().extend([scaleLineControl]),
        layers: [
          layer,
          vectorLayer
        ],
        view: new View({
          center: fromLonLat([2.6370411, 48.8499198]),
          zoom: 10,
          minZoom: 9,
          maxZoom: 16
        })
      });

      let overlay = new Overlay({
        element: document.getElementById("overlay"),
        positioning: "bottom-center"
      });
      const overlayelem = overlay.getElement();
      const select = new Select({
        condition: singleClick,
        hitTolerance: 5
      });

      map.addInteraction(select);
      select.on("select", function (e) {
        const feature = e.target.getFeatures().item(0);
        if (feature) {
          const features = feature.get("features");
          const uic = features[0].get("reflex_zde_id");
          overlayelem.innerHTML =
            `<b>${features[0].get("reflex_zdl_nom")}</b><br/>` +
            _.uniqBy(
              features.map(o => {
                return `${o.get("codifligne_line_name")}`;
              })
            )
              .map(
                (o, i) =>
                  `<span class="line-img ligne${o} alpha" style="height: 1em; width: 1em; top: 0.1em; left: 0;"></span>`
              )
              .join("<span style='padding: 0.1em;'></span>") +
            `<br/><a href='${uic}' target='_blank'>${uic}</a>`;
          overlay.setPosition(feature.getGeometry().getCoordinates());
        } else {
          overlay.setPosition(undefined);
        }
      });
      map.addOverlay(overlay);

      // cursor change on point
      map.on("pointermove", function (evt) {
        map.getTargetElement().style.cursor = map.hasFeatureAtPixel(evt.pixel)
          ? "pointer"
          : "";
      });

      //clear feature and overlay
      map.getView().on("change:resolution", e => {
        //select.getFeatures().clear();
        //overlay.setPosition(undefined);
      });
      map.on("moveend", e => {
        //const zoom = e.map.getView().getZoom();
        /*if (zoom >= 15) {
          layerIgnRoads.setVisible(true);
          layerIgnCadastre.setVisible(true);
        } else if (zoom < 15) {
          layerIgnRoads.setVisible(false);
          layerIgnCadastre.setVisible(false);
        }*/
      });
    } /*[]*/
  );
  return (
    <div id="Home">
      <div
        id="overlay"
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          border: "1px solid black",
          padding: "5px 10px",
          background: "#043a6b",
          textAlign: "center",
          maxWidth: "200px"
        }}
      />
      <div id={id} style={{ width: "100vw", height: "100vh" }} />
    </div>
  );
}
