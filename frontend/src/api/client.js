import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getModels = () => api.get('/models').then(r => r.data)
export const getConversations = () => api.get('/conversations').then(r => r.data)
export const createConversation = (data) => api.post('/conversations', data).then(r => r.data)
export const getConversation = (id) => api.get(`/conversations/${id}`).then(r => r.data)
export const deleteConversation = (id) => api.delete(`/conversations/${id}`)
export const updateConversation = (id, data) => api.patch(`/conversations/${id}`, data).then(r => r.data)
export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form).then(r => r.data)
}

export default api
