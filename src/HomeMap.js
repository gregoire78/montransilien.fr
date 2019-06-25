import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { v4 } from "uuid";
import _ from "lodash";

import OpenMap from "ol/Map";
import View from "ol/View";
import { transform, fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Cluster from "ol/source/Cluster";
import Overlay from "ol/Overlay";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";
import GeoJSON from "ol/format/GeoJSON";
import { toStringHDMS } from "ol/coordinate";
import {
  defaults as defaultControls,
  ScaleLine,
  OverviewMap
} from "ol/control";
import WMTS from "ol/source/WMTS";
import TileWMTS from "ol/tilegrid/WMTS";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import {
  click,
  pointerMove,
  altKeyOnly,
  singleClick
} from "ol/events/condition";
import Select from "ol/interaction/Select";
//import json from "./traces";
import gares from "./db/perimetre";
//import gares from "./rere.geojson";
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
      const resolutions = [
        156543.03392804103,
        78271.5169640205,
        39135.75848201024,
        19567.879241005125,
        9783.939620502562,
        4891.969810251281,
        2445.9849051256406,
        1222.9924525628203,
        611.4962262814101,
        305.74811314070485,
        152.87405657035254,
        76.43702828517625,
        38.218514142588134,
        19.109257071294063,
        9.554628535647034,
        4.777314267823517,
        2.3886571339117584,
        1.1943285669558792,
        0.5971642834779396,
        0.29858214173896974,
        0.14929107086948493,
        0.07464553543474241
      ];
      const tileWmts = new TileWMTS({
        origin: [-20037508, 20037508], // topLeftCorner
        resolutions: resolutions, // résolutions
        matrixIds: [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
          "14",
          "15",
          "16",
          "17",
          "18",
          "19"
        ] // ids des TileMatrix
      });
      const layerIgnSatellite = new TileLayer({
        preload: Infinity,
        source: new WMTS({
          attributions: ["IGN-F/Géoportail"],
          url: "https://wxs.ign.fr/wi5arjlfu40r0fbm6vw8nzny/geoportail/wmts",
          layer: "ORTHOIMAGERY.ORTHOPHOTOS",
          matrixSet: "PM",
          format: "image/jpeg",
          style: "normal",
          tileGrid: tileWmts
        })
      });
      const layerIgn = new TileLayer({
        preload: Infinity,
        source: new WMTS({
          attributions: ["IGN-F/Géoportail"],
          url: "https://wxs.ign.fr/wi5arjlfu40r0fbm6vw8nzny/geoportail/wmts",
          layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGN",
          matrixSet: "PM",
          format: "image/jpeg",
          style: "normal",
          tileGrid: tileWmts
        })
      });
      const layerIgnCadastre = new TileLayer({
        zIndex: 1,
        preload: Infinity,
        source: new WMTS({
          url: "https://wxs.ign.fr/wi5arjlfu40r0fbm6vw8nzny/geoportail/wmts",
          layer: "CADASTRALPARCELS.PARCELS",
          matrixSet: "PM",
          format: "image/png",
          style: "bdparcellaire",
          tileGrid: tileWmts
        })
      });
      const layerIgnAdminstrative = new TileLayer({
        zIndex: 3,
        opacity: 0.6,
        preload: Infinity,
        source: new WMTS({
          url: "https://wxs.ign.fr/wi5arjlfu40r0fbm6vw8nzny/geoportail/wmts",
          layer: "ADMINISTRATIVEUNITS.BOUNDARIES",
          matrixSet: "PM",
          format: "image/png",
          style: "normal",
          tileGrid: tileWmts
        })
      });
      const layerIgnNames = new TileLayer({
        zIndex: 5,
        preload: Infinity,
        source: new WMTS({
          url: "https://wxs.ign.fr/wi5arjlfu40r0fbm6vw8nzny/geoportail/wmts",
          layer: "GEOGRAPHICALNAMES.NAMES",
          matrixSet: "PM",
          format: "image/png",
          style: "normal",
          tileGrid: tileWmts
        })
      });
      const layerIgnRoads = new TileLayer({
        zIndex: 2,
        opacity: 0.5,
        preload: Infinity,
        source: new WMTS({
          url: "https://wxs.ign.fr/wi5arjlfu40r0fbm6vw8nzny/geoportail/wmts",
          layer: "TRANSPORTNETWORKS.ROADS",
          matrixSet: "PM",
          format: "image/png",
          style: "normal",
          tileGrid: tileWmts
        })
      });
      const layerIgnRails = new TileLayer({
        zIndex: 4,
        opacity: 1,
        preload: Infinity,
        source: new WMTS({
          url: "https://wxs.ign.fr/wi5arjlfu40r0fbm6vw8nzny/geoportail/wmts",
          layer: "TRANSPORTNETWORKS.RAILWAYS",
          matrixSet: "PM",
          format: "image/png",
          style: "normal",
          tileGrid: tileWmts
        })
      });

      const styles = {
        Point: new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: "orange" }),
            stroke: new Stroke({
              color: [255, 0, 0],
              width: 2
            })
          })
        }),
        LineString: new Style({
          stroke: new Stroke({
            color: "red",
            width: 5
          })
        })
      };

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
        style: function(feature) {
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

      /*const stylesRer = {
        Point: new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: "yellow" }),
            stroke: new Stroke({
              color: [255, 0, 0],
              width: 2
            })
          })
        })
      };
      const vectorLayerRer = new VectorLayer({
        zIndex: 9,
        projection: "EPSG:3857",
        source: new VectorSource({
          features: new GeoJSON().readFeatures(rer, {
            featureProjection: "EPSG:3857"
          })
        }),
        style: function(feature) {
          return stylesRer[feature.getGeometry().getType()];
        }
      });*/

      /*const vectorLayerLigne = new VectorLayer({
        zIndex: 9,
        projection: "EPSG:3857",
        source: new VectorSource({
          features: new GeoJSON().readFeatures(json, {
            featureProjection: "EPSG:3857"
          })
        }),
        style: function(feature) {
          return styles[feature.getGeometry().getType()];
        }
      });*/

      const map = new OpenMap({
        target: id,
        controls: defaultControls().extend([scaleLineControl]),
        layers: [
          /*new TileLayer({
            zIndex: 0,
            source: new XYZ({
              url: "https://{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
            })
          }),*/
          layer,
          //layerIgnAdminstrative,
          //layerIgnRoads,
          //layerIgnNames,
          //layerIgnCadastre,
          //layerIgn,
          //layerIgnSatellite,
          vectorLayer
          //layerIgnRails
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
      select.on("select", function(e) {
        const feature = e.target.getFeatures().item(0);
        if (feature) {
          //console.log(feature.get("features"));
          /*const features = _.uniqBy(feature.get("features"), o => {
            return o.get("codifligne_line_name");
          });*/
          const features = feature.get("features");
          const uic = features[0].get("reflex_zde_id");
          overlayelem.innerHTML =
            `<b>${features[0].get("reflex_zdl_nom")}</b><br/>` +
            _.uniqBy(
              features.map(o => {
                //let uic = "";
                //if (features.length === 1 || o.get("codifligne_network_name")) {
                //uic = o.get("gtfs_stop_id").match(/(?<=StopPoint:).*(?=:8)/gm);
                //}

                return `${o.get("codifligne_line_name")}`;
              })
            )
              .map(
                (o, i) =>
                  `<span class="line-img ligne${o} alpha" style="height: 1em; width: 1em; top: 0.1em; left: 0;"></span>`
              )
              .join("") +
            `<br/><a href='https://transilien.gregoirejoncour.xyz/${uic}' target='_blank'>${uic}</a><br/>`;
          overlay.setPosition(feature.getGeometry().getCoordinates());
        } else {
          overlay.setPosition(undefined);
        }
      });
      map.addOverlay(overlay);

      /*const displayFeatureInfo = function(pixel, coord) {
        const feature = map.forEachFeatureAtPixel(pixel, function(feature) {
          return feature;
        });

        const info = document.getElementById("info");

        if (feature && feature.get("reflex_lda_nom")) {
          info.innerHTML =
            feature.get("reflex_lda_nom") + ": " + feature.get("gtfs_stop_id");
          //overlayelem.innerHTML = feature.get("reflex_lda_nom");
          //overlay.setPosition(coord);
          //
        } else {
          info.innerHTML = "&nbsp;";
          overlay.setPosition(undefined);
        }
      };*/

      /*map.on("singleclick", function(e) {
        var pixel = map.getEventPixel(e.originalEvent);
        displayFeatureInfo(pixel, e.coordinate);
      });*/

      // cursor change on point
      map.on("pointermove", function(evt) {
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
        const zoom = e.map.getView().getZoom();
        /*if (zoom >= 15) {
          layerIgnRoads.setVisible(true);
          layerIgnCadastre.setVisible(true);
        } else if (zoom < 15) {
          layerIgnRoads.setVisible(false);
          layerIgnCadastre.setVisible(false);
        }*/
      });

      /*map.on("click", function(event) {
        // extract the spatial coordinate of the click event in map projection units
        var coord = event.coordinate;
        // transform it to decimal degrees
        var degrees = transform(coord, "EPSG:3857", "EPSG:4326");
        // format a human readable version
        var hdms = toStringHDMS(degrees);
        // update the overlay element's content
        var element = overlay.getElement();
        element.innerHTML = hdms;
        // position the element (using the coordinate in the map's projection)
        overlay.setPosition(coord);
        // and add it to the map
        map.addOverlay(overlay);
      });*/
    } /*[]*/
  );
  return (
    <>
      <div
        id="overlay"
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          border: "1px solid black",
          padding: "5px 10px"
        }}
      />
      <div id={id} style={{ width: "100vw", height: "100vh" }} />
      {/*<div id="info">&nbsp;</div>*/}
    </>
  );
}
