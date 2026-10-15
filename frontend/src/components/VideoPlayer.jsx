import React, { useState, useEffect, useRef } from 'react';
const SkeletonIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>);
const SkeletonOverlay = () => (<svg className="absolute top-0 left-0 w-full h-full bg-black/20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
    {/* Semi-transparent background to darken video */}
    <rect width="100" height="100" fill="rgba(0,0,0,0.3)"/>
    {/* Head */}
    <circle cx="50" cy="15" r="5" fill="none" stroke="#4ade80" strokeWidth="1.5" opacity="0.9"/>
    {/* Spine */}
    <line x1="50" y1="20" x2="50" y2="50" stroke="#4ade80" strokeWidth="1.5" opacity="0.9"/>
    {/* Shoulders */}
    <line x1="35" y1="25" x2="65" y2="25" stroke="#4ade80" strokeWidth="1.5" opacity="0.9"/>
    {/* Arms */}
    <line x1="35" y1="25" x2="25" y2="40" stroke="#4ade80" strokeWidth="1.5" opacity="0.9"/>
    <line x1="25" y1="40" x2="20" y2="55" stroke="#4ade80" strokeWidth="1.5" opacity="0.9"/>
    <line x1="65" y1="25" x2="75" y2="40" stroke="#4ade80" strokeWidth="1.5" opacity="0.9"/>
    <line x1="75" y1="40" x2="80" y2="55" stroke="#4ade80" strokeWidth="1.5" opacity="0.9"/>
    {/* Hips */}
    <line x1="40" y1="50" x2="60" y2="50" stroke="#4ade80" strokeWidth="1.5" opacity="0.9"/>
    {/* Legs */}
    <line x1="40" y1="50" x2="40" y2="90" stroke="#4ade80" strokeWidth="1.5" opacity="0.9"/>
    <line x1="60" y1="50" x2="60" y2="90" stroke="#4ade80" strokeWidth="1.5" opacity="0.9"/>
  </svg>);
export const VideoPlayer = ({ title, videoUrls, showSkeleton = false, autoPlay = false, }) => {
    const [isSkeletonVisible, setIsSkeletonVisible] = useState(false); // Start with skeleton hidden
    const [currentIndex, setCurrentIndex] = useState(0);
    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef(null);
    const currentVideo = videoUrls[currentIndex];
    // Reset to first video when list changes
    useEffect(() => {
        console.log('VideoPlayer received videoUrls:', videoUrls);
        setCurrentIndex(0);
        setVideoError(false);
        setIsSkeletonVisible(false); // Hide skeleton when new video is set
    }, [JSON.stringify(videoUrls)]);
    // Handle video load
    useEffect(() => {
        if (videoRef.current) {
            console.log('Loading video:', currentVideo);
            videoRef.current.load();
        }
    }, [currentVideo]);
    const handleVideoError = (e) => {
        console.error('Video failed to load:', currentVideo);
        console.error('Error details:', e);
        setVideoError(true);
    };
    const handleVideoLoaded = () => {
        console.log('Video loaded successfully:', currentVideo);
        setVideoError(false);
        // Auto-show skeleton after video loads (only if showSkeleton is true)
        if (showSkeleton) {
            setIsSkeletonVisible(true);
        }
    };
    const getVideoType = (url) => {
        if (url.includes('.webm'))
            return 'video/webm';
        if (url.includes('blob:')) {
            // For blob URLs, we need to check the file extension from the original filename
            // Default to webm for recorded videos, mp4 for others
            return 'video/webm';
        }
        if (url.includes('.mp4'))
            return 'video/mp4';
        if (url.includes('.mov'))
            return 'video/quicktime';
        if (url.includes('.ogg'))
            return 'video/ogg';
        return 'video/mp4'; // default
    };
    return (<div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
      {/* Title + Skeleton toggle */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">{title}</h3>
        {showSkeleton && (<button onClick={() => setIsSkeletonVisible(!isSkeletonVisible)} className={`flex items-center space-x-2 text-xs px-3 py-1 rounded-full transition-colors ${isSkeletonVisible ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
            <SkeletonIcon />
            <span>Skeleton</span>
          </button>)}
      </div>

      {/* Video player */}
      <div className="aspect-video w-full rounded-lg overflow-hidden relative bg-black">
        {currentVideo && currentVideo.length > 0 ? (<>
            <video ref={videoRef} key={currentVideo} className="w-full h-full object-contain" controls loop autoPlay={autoPlay} muted={autoPlay} playsInline preload="auto" onError={handleVideoError} onLoadedData={handleVideoLoaded} onLoadedMetadata={() => console.log('Video metadata loaded')}>
              <source src={currentVideo} type={getVideoType(currentVideo)}/>
              <source src={currentVideo} type="video/webm"/>
              <source src={currentVideo} type="video/mp4"/>
              Your browser does not support the video tag.
            </video>
            {isSkeletonVisible && <SkeletonOverlay />}
          </>) : (<div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <p className="text-sm">No video URL provided</p>
            <p className="text-xs mt-2">Please record or upload a video</p>
          </div>)}
      </div>

      {/* Video selector buttons */}
      {videoUrls.length > 1 && (<div className="flex flex-wrap gap-2 mt-3 justify-center">
          {videoUrls.map((v, i) => (<button key={v} onClick={() => setCurrentIndex(i)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${i === currentIndex ? 'bg-teal-500 text-black' : 'bg-gray-700 text-white'}`}>
              {`Ref ${i + 1}`}
            </button>))}
        </div>)}
    </div>);
};
