import React, { useState, useRef, useCallback } from 'react';
export const WebcamRecorder = ({ onRecordingComplete, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const startWebcam = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        }
        catch (err) {
            console.error('Error accessing webcam:', err);
            setError('Unable to access webcam. Please check your permissions.');
        }
    }, []);
    const stopWebcam = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);
    const startRecording = useCallback(() => {
        if (!stream)
            return;
        try {
            const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
                .find((t) => MediaRecorder.isTypeSupported(t));
            const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            chunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'video/webm' });
                const videoUrl = URL.createObjectURL(blob);
                onRecordingComplete(blob, videoUrl);
            };
            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            setRecordingTime(0);
            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        catch (err) {
            console.error('Error starting recording:', err);
            setError('Failed to start recording. Please try again.');
        }
    }, [stream, onRecordingComplete]);
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            stopWebcam();
        }
    }, [isRecording, stopWebcam]);
    const handleCancel = () => {
        stopWebcam();
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        onCancel();
    };
    React.useEffect(() => {
        startWebcam();
        return () => {
            stopWebcam();
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    return (<div className="min-h-screen bg-canvas p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-line p-8">
        <h2 className="text-3xl font-serif text-ink mb-6 text-center">
          Record Your Performance
        </h2>

        {error && (<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
            {error}
          </div>)}

        <div className="relative bg-black rounded-lg overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
          
          {isRecording && (<div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-mono text-lg bg-black/50 px-3 py-1 rounded">
                {formatTime(recordingTime)}
              </span>
            </div>)}
        </div>

        <div className="flex gap-4">
          <button onClick={handleCancel} className="flex-1 px-6 py-3 text-lg font-semibold text-white bg-white border border-line text-ink rounded-full hover:border-ink/40 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500">
            Cancel
          </button>
          
          {!isRecording ? (<button onClick={startRecording} disabled={!stream} className="flex-1 px-6 py-3 text-lg font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed">
              Start Recording
            </button>) : (<button onClick={stopRecording} className="flex-1 px-6 py-3 text-lg font-semibold text-white bg-brand rounded-full hover:bg-brand-deep transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500">
              Stop & Analyze
            </button>)}
        </div>

        <p className="text-center text-sm text-ink-soft mt-4">
          <strong>Tip:</strong> Record for at least 10 seconds to get accurate analysis. Make sure your entire body is visible.
        </p>
      </div>
    </div>);
};
