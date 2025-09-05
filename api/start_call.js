const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const allowCors = fn => async (req, res) => {
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { channelName, userId } = req.body;

    // Use environment variables for production
    const APP_ID = process.env.APP_ID;
    const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    if (!APP_ID || !APP_CERTIFICATE) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const uid = userId || Math.floor(Math.random() * 100000);
    const role = RtcRole.PUBLISHER;
    const expireTime = 3600; // 1 hour
    
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
      action: 'call_started'
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
};

module.exports = allowCors(handler);