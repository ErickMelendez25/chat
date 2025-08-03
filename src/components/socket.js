// socket.js
import { io } from 'socket.io-client';

const socket = io('https://chat-production-c0ef.up.railway.app'); // sin /socket.io/

export default socket;
