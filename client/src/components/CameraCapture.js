"use client"

import React, { useRef, useState, useEffect } from "react"
import { Camera, X, RotateCcw, Check } from "lucide-react"

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [facingMode, setFacingMode] = useState("environment") // 'environment' for back camera, 'user' for front
  const [error, setError] = useState(null)

  // Initialize camera when component mounts
  useEffect(() => {
    startCamera()

    // Clean up when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(newStream)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }

      setError(null)
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Could not access camera. Please ensure you have granted camera permissions.")
    }
  }

  const switchCamera = () => {
    setFacingMode((prevMode) => (prevMode === "environment" ? "user" : "environment"))
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current video frame to the canvas
    const context = canvas.getContext("2d")
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to data URL
    const imageDataUrl = canvas.toDataURL("image/jpeg")
    setCapturedImage(imageDataUrl)

    // Stop the camera stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const confirmPhoto = () => {
    if (capturedImage && onCapture) {
      // Convert data URL to Blob for easier handling
      fetch(capturedImage)
        .then((res) => res.blob())
        .then((blob) => {
          // Create a File object from the Blob
          const file = new File([blob], "captured-image.jpg", { type: "image/jpeg" })
          onCapture(file, capturedImage)
        })
    }
  }

  return React.createElement(
    "div",
    { className: "camera-capture-container" },
    React.createElement(
      "div",
      { className: "camera-header d-flex justify-content-between align-items-center p-2 bg-dark text-white" },
      React.createElement("h5", { className: "m-0" }, "Take Photo"),
      React.createElement(
        "button",
        {
          className: "btn btn-sm btn-outline-light",
          onClick: onClose,
          "aria-label": "Close camera",
        },
        React.createElement(X, { size: 18 }),
      ),
    ),
    React.createElement(
      "div",
      { className: "camera-body position-relative" },
      error && React.createElement("div", { className: "alert alert-danger m-3" }, error),
      !capturedImage
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement("video", {
              ref: videoRef,
              autoPlay: true,
              playsInline: true,
              className: "w-100 h-auto",
              style: { display: stream ? "block" : "none" },
            }),
            React.createElement(
              "div",
              { className: "camera-controls d-flex justify-content-around p-3" },
              React.createElement(
                "button",
                {
                  className: "btn btn-outline-secondary",
                  onClick: switchCamera,
                  disabled: !stream,
                  "aria-label": "Switch camera",
                },
                React.createElement(RotateCcw, { size: 20 }),
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-primary rounded-circle",
                  onClick: capturePhoto,
                  disabled: !stream,
                  "aria-label": "Take photo",
                  style: { width: "60px", height: "60px" },
                },
                React.createElement(Camera, { size: 24 }),
              ),
            ),
          )
        : React.createElement(
            React.Fragment,
            null,
            React.createElement(
              "div",
              { className: "captured-image-container" },
              React.createElement("img", {
                src: capturedImage || "/placeholder.svg",
                alt: "Captured",
                className: "w-100 h-auto",
              }),
            ),
            React.createElement(
              "div",
              { className: "camera-controls d-flex justify-content-around p-3" },
              React.createElement(
                "button",
                {
                  className: "btn btn-outline-secondary",
                  onClick: retakePhoto,
                  "aria-label": "Retake photo",
                },
                React.createElement(RotateCcw, { size: 20 }),
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-success",
                  onClick: confirmPhoto,
                  "aria-label": "Confirm photo",
                },
                React.createElement(Check, { size: 20 }),
                " Use Photo",
              ),
            ),
          ),
    ),
    React.createElement("canvas", {
      ref: canvasRef,
      style: { display: "none" },
    }),
  )
}

export default CameraCapture

