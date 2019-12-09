import React, { Component } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import "./FaceMatcher.scss";

class FaceMatcher extends Component {
  state = {
    loadedUser: "NA",
    videoSrc: null
  };

  async componentDidMount() {
    Promise.all([
      await faceapi.loadSsdMobilenetv1Model("/models"),
      await faceapi.loadFaceLandmarkModel("/models"),
      await faceapi.loadFaceRecognitionModel("/models")
    ]).then(() => {
      this.loadLabelDescriptors();
      faceapi.env.monkeyPatch({
        fetch: fetch,
        Canvas: window.HTMLCanvasElement,
        Image: window.HTMLImageElement,
        createCanvasElement: () => document.createElement("canvas"),
        createImageElement: () => document.createElement("img")
      });
      // if (navigator.getUserMedia) {
      //   navigator.getUserMedia(
      //     { video: true },
      //     this.handleVideo,
      //     this.videoError
      //   );
      // }
    });
  }
  labeledFaceDescriptors = [];
  loadedUser = "";

  handleVideo = stream => {};
  videoError = () => {};

  loadLabelDescriptors = async () => {
    const labels = ["/images/ashis"];
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

  validateUser = async () => {
    const input = document.getElementById("myVid") as HTMLVideoElement;
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

    if (results) {
      this.setState({
        loadedUser: results[0].label || "NA"
      });
    }
  };

  render() {
    const { loadedUser: userName } = this.state;
    return (
      <section className="container">
        <Webcam id="myVid" audio={false} />
        <button onClick={this.validateUser}>Validate</button>
        <section> User is {userName === "NA" ? "Stranger" : userName} </section>
      </section>
    );
  }
}
export default FaceMatcher;
