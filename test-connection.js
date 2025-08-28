// WebRTC Connection Test Script
// Run this in browser console to test WebRTC functionality

console.log('🧪 Starting WebRTC Connection Test...');

// Test 1: Check WebRTC support
function testWebRTCSupport() {
  console.log('📋 Test 1: WebRTC Support');
  
  if (!navigator.mediaDevices) {
    console.error('❌ navigator.mediaDevices not supported');
    return false;
  }
  
  if (!window.RTCPeerConnection) {
    console.error('❌ RTCPeerConnection not supported');
    return false;
  }
  
  console.log('✅ WebRTC is supported');
  return true;
}

// Test 2: Check WebSocket connection
function testWebSocketConnection() {
  console.log('📋 Test 2: WebSocket Connection');
  
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      ws.close();
      resolve(true);
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket connection failed:', error);
      resolve(false);
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket closed');
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket connection timeout');
        resolve(false);
      }
    }, 5000);
  });
}

// Test 3: Check STUN servers
function testSTUNServers() {
  console.log('📋 Test 3: STUN Server Connectivity');
  
  const stunServers = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302'
  ];
  
  let workingServers = 0;
  
  return new Promise((resolve) => {
    stunServers.forEach((server, index) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: server }]
      });
      
      pc.createDataChannel('test');
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`✅ STUN server ${index + 1} working:`, server);
          workingServers++;
        }
      };
      
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          if (workingServers === 0) {
            console.error(`❌ STUN server ${index + 1} failed:`, server);
          }
          
          if (index === stunServers.length - 1) {
            console.log(`📊 STUN servers working: ${workingServers}/${stunServers.length}`);
            resolve(workingServers > 0);
          }
        }
      };
      
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(error => {
          console.error(`❌ Error testing STUN server ${index + 1}:`, error);
        });
    });
  });
}

// Test 4: Check network connectivity
function testNetworkConnectivity() {
  console.log('📋 Test 4: Network Connectivity');
  
  return fetch('http://localhost:3001/health')
    .then(response => {
      if (response.ok) {
        console.log('✅ Local server reachable');
        return response.json();
      } else {
        console.error('❌ Local server not responding properly');
        return null;
      }
    })
    .then(data => {
      if (data) {
        console.log('📊 Server status:', data);
      }
      return data !== null;
    })
    .catch(error => {
      console.error('❌ Cannot reach local server:', error);
      return false;
    });
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive connection test...\n');
  
  const results = {
    webrtc: testWebRTCSupport(),
    websocket: await testWebSocketConnection(),
    stun: await testSTUNServers(),
    network: await testNetworkConnectivity()
  };
  
  console.log('\n📊 Test Results:');
  console.log('WebRTC Support:', results.webrtc ? '✅' : '❌');
  console.log('WebSocket Connection:', results.websocket ? '✅' : '❌');
  console.log('STUN Servers:', results.stun ? '✅' : '❌');
  console.log('Network Connectivity:', results.network ? '✅' : '❌');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! WebRTC should work properly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the issues above.');
    
    if (!results.websocket) {
      console.log('💡 Solution: Make sure the signaling server is running on port 3001');
    }
    if (!results.stun) {
      console.log('💡 Solution: Check your firewall settings or network connectivity');
    }
    if (!results.network) {
      console.log('💡 Solution: Start the server with: cd server && node server.js');
    }
  }
  
  return results;
}

// Export for use in console
window.testWebRTCConnection = runAllTests;

console.log('💡 Run testWebRTCConnection() to start the test');
