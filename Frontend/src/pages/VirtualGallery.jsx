import React from 'react';

const VirtualGallery = () => {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
      <div className="w-full max-w-6xl aspect-video">
        <iframe
          width="560"
          height="315"
          src="https://www.artsteps.com/embed/68ff0020fd592b18c0796dc3/560/315"
          frameBorder="0"
          allowFullScreen
          title="Artsteps Virtual Gallery"
          className="rounded-xl shadow-lg w-full h-full"
        ></iframe>
      </div>
    </div>
  );
};

export default VirtualGallery;
