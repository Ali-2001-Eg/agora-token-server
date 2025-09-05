const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

console.log('Join-call endpoint loaded');

const allowCors = fn => async (req, res) => {
  console.log('CORS middleware triggered');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

const handler = async (req, res) => {
  console.log('Handler called with method:', req.method);
  
  // Add GET method support for testing
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Join-call API is working! Use POST method with {"channelName":"your_channel"}',
      example: 'curl -X POST https://your-url/api/join-call -H "Content-Type: application/json" -d \'{"channelName":"testchannel"}\''
    });
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('Request body:', req.body);
    const { channelName, userId } = req.body;

    // Use environment variables for production
    const APP_ID = process.env.APP_ID;
    const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

    console.log('APP_ID:', APP_ID ? 'SET' : 'NOT SET');
    console.log('APP_CERTIFICATE:', APP_CERTIFICATE ? 'SET' : 'NOT SET');

    if (!APP_ID) {
      console.error('APP_ID environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error: APP_ID missing' });
    }

    if (!APP_CERTIFICATE) {
      console.error('APP_CERTIFICATE environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error: APP_CERTIFICATE missing' });
    }

    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const uid = userId || Math.floor(Math.random() * 100000);
    const role = RtcRole.PUBLISHER;
    const expireTime = 3600;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );

    res.status(200).json({ 
      success: true,
      token: token,
      appId: APP_ID,
      channel: channelName,
      uid: uid,
      action: 'call_joined'
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
};

module.exports = allowCors(handler);