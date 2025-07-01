import React, { useRef, useEffect, useState } from 'react';
import Peer from 'peerjs';

export default function VideoCall() {
  const localVid = useRef();
  const remoteVid = useRef();
  const [peerId, setPeerId] = useState('');
  const [theirId, setTheirId] = useState('');
  const [peer, setPeer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);

  const getUserMediaSafe = async (constraints) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;

      if (!getUserMedia) {
        throw new Error('getUserMedia not supported in this browser.');
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }

    return navigator.mediaDevices.getUserMedia(constraints);
  };

  useEffect(() => {
    const p = new Peer();
    setPeer(p);

    p.on('open', (id) => {
      setPeerId(id);
    });

    p.on('call', (call) => {
      setCurrentCall(call);
      getUserMediaSafe({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          const localNode = localVid.current;
          if (localNode) localNode.srcObject = stream;

          call.answer(stream);
          call.on('stream', (remoteStream) => {
            const remoteNode = remoteVid.current;
            if (remoteNode) remoteNode.srcObject = remoteStream;
          });

          setIsCallActive(true);
        })
        .catch((err) => {
          console.error('Media device error:', err);
          alert('Camera/Microphone access failed. Use HTTPS or localhost.');
        });
    });

    // 🔐 Take snapshot of refs for cleanup
    const localNodeCleanup = localVid.current;
    const remoteNodeCleanup = remoteVid.current;

    return () => {
      if (p) p.destroy();

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (currentCall) {
        currentCall.close();
      }

      if (localNodeCleanup) localNodeCleanup.srcObject = null;
      if (remoteNodeCleanup) remoteNodeCleanup.srcObject = null;

      setIsCallActive(false);
      setIsMuted(false);
      setIsVideoOff(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCall = async () => {
    if (!peer || !theirId.trim()) {
      alert('Please enter a valid Peer ID');
      return;
    }

    try {
      const stream = await getUserMediaSafe({ video: true, audio: true });
      setLocalStream(stream);

      if (localVid.current) {
        localVid.current.srcObject = stream;
      }

      const call = peer.call(theirId, stream);
      setCurrentCall(call);

      call.on('stream', (remoteStream) => {
        if (remoteVid.current) {
          remoteVid.current.srcObject = remoteStream;
        }
      });

      setIsCallActive(true);
    } catch (err) {
      console.error('Error starting call:', err);
      alert('Camera/Mic access failed.');
    }
  };

  const stopCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (currentCall) {
      currentCall.close();
      setCurrentCall(null);
    }

    if (localVid.current) {
      localVid.current.srcObject = null;
    }

    if (remoteVid.current) {
      remoteVid.current.srcObject = null;
    }

    setIsCallActive(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="call-box">
      <div className="peer-id-section">
        <strong>Your Video Peer ID:</strong>
        <code>{peerId || 'Connecting...'}</code>
      </div>

      <input
        type="text"
        placeholder="Friend's Peer ID"
        value={theirId}
        onChange={(e) => setTheirId(e.target.value)}
        disabled={isCallActive}
      />

      <div className="videos">
        <div className="video-container">
          <video
            ref={localVid}
            autoPlay
            muted
            className="box-video"
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="video-label">You</div>
        </div>
        <div className="video-container">
          <video ref={remoteVid} autoPlay className="box-video" />
          <div className="video-label">Friend</div>
        </div>
      </div>

      <div className="call-controls">
        {!isCallActive ? (
          <button onClick={startCall} className="start-call-btn">
            📞 Start Video Call
          </button>
        ) : (
          <div className="active-controls">
            <button
              onClick={toggleMute}
              className={`control-btn ${isMuted ? 'muted' : ''}`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            <button
              onClick={toggleVideo}
              className={`control-btn ${isVideoOff ? 'video-off' : ''}`}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? '📹' : '📸'}
            </button>
            <button onClick={stopCall} className="stop-call-btn">
              ❌ End Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
