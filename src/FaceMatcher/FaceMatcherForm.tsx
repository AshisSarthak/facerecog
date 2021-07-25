import React, { Component } from "react";
import * as faceapi from "face-api.js";
import * as $ from "jquery";
import Webcam from "react-webcam";
import "./FaceMatcher.css";

class FaceMatcher extends Component {
  state = {
    userName: "NA",
    isLoading: true
  };

  labeledFaceDescriptors = [];

  loadModels = async () => {
    const MODEL_URL = "/models";
    await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
    await faceapi.loadFaceLandmarkModel(MODEL_URL);
    await faceapi.loadFaceRecognitionModel(MODEL_URL);
  };

  async componentDidMount() {
    Promise.all([await this.loadModels(), this.loadLabelDescriptors()]).then(
      () => {
        faceapi.env.monkeyPatch({
          fetch: fetch,
          Canvas: window.HTMLCanvasElement,
          Image: window.HTMLImageElement,
          createCanvasElement: () => document.createElement("canvas"),
          createImageElement: () => document.createElement("img")
        });
        this.validateUser();
      }
    );
  }

  loadLabelDescriptors = async () => {
    const labels = ["ashis", "mohit"];
    return await Promise.all(
      labels.map(async label => {
        // fetch image data from urls and convert blob to HTMLImage element
        const imgUrl = `/images/${label}.png`;
        const img = await faceapi.fetchImage(imgUrl);

        // detect the face with the highest score in the image and compute it's landmarks and face descriptor
        const fullFaceDescription = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!fullFaceDescription) {
          throw new Error(`no faces detected for ${label}`);
        }

        const faceDescriptors = [fullFaceDescription.descriptor];
        this.labeledFaceDescriptors.push(
          new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
        );
      })
    );
  };

  validateUser = async () => {
    const input = document.getElementById("myVid") as HTMLCanvasElement;
    let fullFaceDescriptions = await faceapi
      .detectAllFaces(input)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const canvas = $("#overlay").get(0);
    const dims = faceapi.matchDimensions(canvas, input, true);

    const maxDescriptorDistance = 0.9;
    const faceMatcher = new faceapi.FaceMatcher(
      this.labeledFaceDescriptors,
      maxDescriptorDistance
    );

    const results = fullFaceDescriptions.map(fd => {
      const resizedResult = faceapi.resizeResults(fd, dims);
      faceapi.draw.drawDetections(canvas, resizedResult);
      // faceapi.draw.drawFaceLandmarks(canvas, resizedResult);
      return faceMatcher.findBestMatch(fd.descriptor);
    });

    if (results && results[0]) {
      setTimeout(() => {
        this.setState({
          userName: this.formatName(results[0].label) || "NA",
          isLoading: false
        });
      }, 1000);
    } else {
      this.setState({
        userName: undefined,
        isLoading: false
      });
    }
  };

  formatName = nameStr => nameStr.replace(/^.*[\\\/]/, "").toUpperCase();

  render() {
    return (
      <section className="container">
        {this.state.isLoading ? (
          <React.Fragment>
            <Webcam id="myVid" audio={false} className="videoEl" />
            <canvas id="overlay" />
            <section className="loadingText">
              Please wait while we verfiy you
            </section>
          </React.Fragment>
        ) : !this.state.userName || this.state.userName === "UNKNOWN" ? (
          <React.Fragment>
            <section className="loadingText">
              You do not have Permissions.
            </section>
            <section className="detailsPage">
              Kindly Contact the Adminstrator
            </section>
          </React.Fragment>
        ) : (
          <section className="verified-page">
            <h3 className="userHeader">Welcome {this.state.userName}</h3>
            <section className="detailsPage">
              Let's Get Started with the Presentation !!
            </section>
          </section>
        )}
      </section>
    );
  }
}
export default FaceMatcher;
