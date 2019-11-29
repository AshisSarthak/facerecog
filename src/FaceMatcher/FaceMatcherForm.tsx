import React, { Component } from "react";
import * as faceapi from "face-api.js";
import "./FaceMatcher.scss";
import { TNetInput } from "face-api.js";

class FaceMatcher extends Component {
  state = {
    loadedUser: "NA"
  };
  async componentDidMount() {
    await faceapi.loadSsdMobilenetv1Model("/models");
    await faceapi.loadFaceLandmarkModel("/models");
    await faceapi.loadFaceRecognitionModel("/models");
    this.loadLabelDescriptors();

    faceapi.env.monkeyPatch({
      fetch: fetch,
      Canvas: window.HTMLCanvasElement,
      Image: window.HTMLImageElement,
      createCanvasElement: () => document.createElement("canvas"),
      createImageElement: () => document.createElement("img")
    });
  }
  labeledFaceDescriptors = [];
  loadedUser = "";

  loadLabelDescriptors = async () => {
    const labels = ["/images/download"];
    return await Promise.all(
      labels.map(async label => {
        // fetch image data from urls and convert blob to HTMLImage element
        const imgUrl = `${label}.png`;
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

  uploadImage = async () => {
    const input = document.getElementById("myImg") as HTMLCanvasElement;
    let fullFaceDescriptions = await faceapi
      .detectAllFaces(input)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const maxDescriptorDistance = 0.6;
    const faceMatcher = new faceapi.FaceMatcher(
      this.labeledFaceDescriptors,
      maxDescriptorDistance
    );

    const results = fullFaceDescriptions.map(fd =>
      faceMatcher.findBestMatch(fd.descriptor)
    );

    this.setState({
      loadedUser: results[0].label || "NA"
    });
  };

  render() {
    const { loadedUser: userName } = this.state;
    return (
      <section className="container">
        <img id="myImg" src="/images/download.png" onClick={this.uploadImage} />
        <section> User is {userName === "NA" ? "Stranger" : userName} </section>
      </section>
    );
  }
}
export default FaceMatcher;
