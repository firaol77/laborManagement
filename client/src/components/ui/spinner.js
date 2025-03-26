const Spinner = ({ size = "default", className = "" }) => {
    const sizeClass = size === "small" ? "spinner-sm" : ""
    return <div className={`spinner ${sizeClass} ${className}`} />
  }
  
  export default Spinner
  
  