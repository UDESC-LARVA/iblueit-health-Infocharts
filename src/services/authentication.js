
import axios from 'axios';

import { BaseUrl } from '../providers/_config';
import { saveAuthenticationData } from '../providers/sessionStorage';
import { extractMessage } from '../components/notification';


const postAuthentication = async (context, username, password) => {
  context.setLoading(true);
  try {
    const result = await axios.post(`${BaseUrl()}/login`, { username, password });
    saveAuthenticationData(result)
  } catch (error) {
    context.addNotification('error', extractMessage(error, 'Usuário ou senha incorretos'));
    throw 'erro';
  } finally {
    context.setLoading(false);
  }
}

export {
  postAuthentication,
};
