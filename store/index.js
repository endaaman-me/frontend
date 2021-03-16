import urlJoin from 'url-join'
import fetch from 'node-fetch'
import cookieParser from 'cookie'
import Cookies from 'js-cookie'
import { Article, Category } from '../models'


export const plugins = [
  function(store) {
    Article.store = store
    Category.store = store
  },
]

export const state = () => ({
  authorized: false,
  token: null,
  host: '',
  // apiRoot: '',
  // staticRoot: '',
  status: null,
})

export const mutations = {
  setToken(state, token) {
    state.token = token
  },
  clearToken(state) {
    state.token = null
    if (!process.server) {
      Cookies.remove('token', {
        // domain: `.${ state.host }`,
        sameSite: 'lax',
      })
    }
  },
  setAuthorized(state, authorized) {
    state.authorized = authorized
  },
  initHosts(state, host) {
    state.host = host
  },
  setStatus(state, status) {
    state.status = status
  },
}


export const actions = {
  async nuxtServerInit({ commit, dispatch }, { req }) {
    commit('initHosts', req.headers.host)
    if (req.headers.cookie) {
      const { token } = cookieParser.parse(req.headers.cookie)
      if (token) {
        dispatch('setToken', { token })
        await dispatch('checkAuth')
      }
    }
    await Promise.all([
      dispatch('article/getArticles'),
      dispatch('category/getCategories'),
    ])
  },
  nuxtClientInit({ commit }) {
    commit('article/wrap')
    commit('category/wrap')
  },
  setToken({ commit, state }, { token }) {
    commit('setToken', token)
    if (!process.server) {
      Cookies.set('token', token, {
        expires: 365,
        // domain: `.${state.host}`,
        sameSite: 'lax',
      })
    }
  },
  async login({ getters, commit, dispatch }, { password }) {
    const res = await getters.api('/sessions', {
      method: 'POST',
      json: { password },
    })
    if (!res.ok) {
      return { error: await res.text() }
    }
    const result = await res.json()
    dispatch('setToken', { token: result.token })
    commit('setAuthorized', true)
    await dispatch('article/fetchArticles')
    return { error: null }
  },
  async checkAuth({ getters, commit, dispatch }) {
    const res = await getters.api('/sessions', { method: 'GET' })
    if (!res.ok) {
      commit('clearToken')
    }
    commit('setAuthorized', res.ok)
  },
  async logout({ getters, commit, dispatch }) {
    commit('clearToken')
    commit('setAuthorized', false)
    await dispatch('article/fetchArticles')
  },
  async fetchStatus({ getters, commit, dispatch }) {
    const res = await getters.api('/misc/status', { method: 'GET' })
    commit('setStatus', await res.json())
  },

  async restartWatcher({ commit, rootGetters, dispatch }) {
    const res = await rootGetters.api('/misc/watcher/restart', { method: 'POST', })
    if (!res.ok) {
      return { error: await res.text() }
    }
    const data = await res.json()
    await dispatch('fetchStatus')
    return { error: null, data }
  },
}

export const getters = {
  staticRoot({ host }) {
    const isDev = process.env.NODE_ENV !== 'production'
    const isServer = !!process.server
    const isSSL = /SSL/.test(process.env.SSL)
    return isDev
      ? 'http://localhost:3001/static'
      : isServer
        ? `${ isSSL ? 'https' : 'http' }://static.${ host }`
        : `//static.${ host }`
  },
  api({ host, token }) {
    const isDev = process.env.NODE_ENV !== 'production'
    const isServer = !!process.server
    const isSSL = /SSL/.test(process.env.SSL)

    const apiRoot = isDev
      ? 'http://localhost:3001/v1'
      : isServer
        ? `${ isSSL ? 'https' : 'http' }://api.${ host }/v1`
        : `//api.${ host }/v1`

    const headers = {}
    if (token) {
      headers['Authorization'] = 'Bearer ' + token
    }
    return (url, options = {}) => {
      if (options.json) {
        options['body'] = JSON.stringify(options.json)
        headers['Content-Type'] = 'application/json'
      }
      if (options.headers) {
        options.headers = {
          ...headers,
          ...options.headers,
        }
      } else {
        options.headers = headers
      }
      return fetch(urlJoin(apiRoot, url), options)
    }
  },
  activeCategory(state, getters) {
    if (!state.route) {
      return null
    }
    if (state.route.name !== 'index') {
      return null
    }
    const categorySlug = state.route.query.category
    if (!categorySlug) {
      return null
    }
    return getters['category/findCategory'](categorySlug)
  },
  activeTag(state, getters) {
    if (!state.route) {
      return null
    }
    if (state.route.name !== 'index') {
      return null
    }
    const tag = state.route.query.tag
    const tags = getters['article/tags']
    if (!tags.includes(tag)) {
      return null
    }
    return tag
  },
  activeArticle(state, getters) {
    if (!state.route) {
      return null
    }
    if (state.route.name !== 's1-s2') {
      return null
    }
    const { s1, s2 } = state.route.params
    return getters['article/getArticleByRelative'](s1 + '/' + s2)
  },
}
