import getConfig from 'next/config'
import axios from 'axios'
import { get } from 'lodash'
import moment from 'moment'
import { getChartData, getDataByType, METRIC_TYPE } from './utils/chart'
import localStorage from 'local-storage'
const API = {
    Application: {
        Base: 'applications',
        Count: 'count',
        List: '',
        Detail: '{id}',
        Create: '',
        Update: '{id}',
        Delete: '{id}',
        Cancel: '{id}/cancel',
        Log: '{id}/logs/{log_type}',
        Groups: '{id}/groups',
        Graphs: 'groups/{id}/graphs',
        GraphMetrics: 'graphs/{id}/metrics',
        Metrics: {
            Base: 'metrics',
            Counters: '{id}/counters',
            Histogram: '{id}/histograms',
            Gauges: '{id}/gauges',
            Metric: '{id}'
        }
    },
    Auth: {
        Login: 'users/login'
    }
}
const response = {
    error: {
        succeed: false,
        title: 'Error',
        status: 500,
        message: 'An error occured',
    },
    success: {
        title: 'Thành công!',
        status: 200,
        message: 'Xử lý thành công!',
        succeed: true
    }
}
const allowAnonymouApis = [
    `/${API.Auth.Login}`,
]
function getAuth() {
    try {
        const token = localStorage.get('token')
        return JSON.parse(token)
    } catch (error) {
        console.error(error)
    }
}
function authorize({ token }) {
    token = token || getAuth()
    if (!token) {
        return '/auth/login'
    }
    return token
}
export class GobenchService {
    constructor() {
        this.contextPath = getConfig().publicRuntimeConfig.contextPath
        this.apiPath = getConfig().publicRuntimeConfig.apiPath

        this.instance = axios.create({
            baseURL: this.apiPath
        })
        // Add a request interceptor
        this.instance.interceptors.request.use(function (config) {
            // Do something before request is sent
            var url = new URL(`${config.baseURL}/${config.url}`)
            if (allowAnonymouApis.includes(url.pathname)) {
                return config
            }
            config.headers.Authorization = `Bearer ${localStorage.get('token')}`
            return config
        }, function (error) {
            // Do something with request error
            console.error('axios request ERRR', error)
            return Promise.reject(error)
        })

        // Add a response interceptor
        this.instance.interceptors.response.use(function (response) {
            // Any status code that lie within the range of 2xx cause this function to trigger
            // Do something with response data
            // console.log('axios response', response)
            return response.data
        }, function (error) {
            // Any status codes that falls outside the range of 2xx cause this function to trigger
            // Do something with response error
            if (error.status === 401) {
                return 'unauthorized'
            }
            console.error('axios response ERR', error)
            const errorData = get(error, ['response', 'data'], error)
            return Promise.reject(error)
        })
    }
    getAuth() {
        return getAuth()
    }
    authorize({ token }) {
        const result = authorize({ token })
        return result
    }
    async login({ username = 'admin', password }) {
        const response = await this.instance.post(API.Auth.Login, { username, password })
        return response
    }
    // applications
    async getApplications({ limit = 100, offset = 0, order = 'created_at', isAsc = false, keyword = '' }) {
        const response = await this.instance.get(`${API.Application.Base}/${API.Application.List}?limit=${limit}&offset=${offset}&order=${order}&isAsc=${isAsc}&keyword=${keyword}`)
        return response
    }
    async getApplication({ id }) {
        const response = await this.instance.get(`${API.Application.Base}/${API.Application.Detail.replace('{id}', id)}`)
        return response
    }
    async getApplicationLog({ id, type }) {
        const response = await this.instance.get(`${API.Application.Base}/${API.Application.Log.replace('{id}', id).replace('{log_type}', type)}`)
        return response
    }
    async createApplication(application) {
        const response = await this.instance.post(`${API.Application.Base}/${API.Application.Create}`, application)
        return response
    }
    async updateApplication({ id, application }) {
        const response = await this.instance.put(`${API.Application.Base}/${API.Application.Update.replace('{id}', id)}`, application)
        return response
    }
    async deleteApplication({ id }) {
        const response = await this.instance.delete(`${API.Application.Base}/${API.Application.Delete.replace('{id}', id)}`)
        return response
    }
    async cancelApplication({ id }) {
        const response = await this.instance.put(`${API.Application.Base}/${API.Application.Cancel.replace('{id}', id)}`)
        return response
    }
    // metrics
    async getGroups({ id }) {
        const response = await this.instance.get(`${API.Application.Base}/${API.Application.Groups.replace('{id}', id)}`)
        return response
    }
    async getGraphs({ id }) {
        const response = await this.instance.get(`${API.Application.Base}/${API.Application.Graphs.replace('{id}', id)}`)
        return response
    }
    async getGraphMetrics({ id }) {
        const response = await this.instance.get(`${API.Application.Base}/${API.Application.GraphMetrics.replace('{id}', id)}`)
        return response
    }
    async getCounters({ id, from = '', end = '' }) {
        const response = await this.instance.get(`${API.Application.Base}/${API.Application.Metrics.Base}/${API.Application.Metrics.Counters.replace('{id}', id)}?from=${from}&end=${end}`)
        return response
    }
    async getHistograms({ id, from = '', end = '' }) {
        const response = await this.instance.get(`${API.Application.Base}/${API.Application.Metrics.Base}/${API.Application.Metrics.Histogram.replace('{id}', id)}?from=${from}&end=${end}`)
        return response
    }
    async getGauges({ id, from = '', end = '' }) {
        const response = await this.instance.get(`${API.Application.Base}/${API.Application.Metrics.Base}/${API.Application.Metrics.Gauges.replace('{id}', id)}?from=${from}&end=${end}`)
        return response
    }
    async getMetrics({ id, from = '', end = '' }) {
        const response = await this.instance.get(`${API.Application.Base}/${API.Application.Metrics.Base}/${API.Application.Metrics.Gauges.replace('{id}', id)}?from=${from}&end=${end}`)
        return response
    }
    async getMetricData(id, type = METRIC_TYPE.COUNTER, from = '', end = '') {
        switch (type) {
            case METRIC_TYPE.COUNTER:
                return getCounters(id, from, end)
            case METRIC_TYPE.HISTOGRAM:
                return getHistograms(id, from, end)
            case METRIC_TYPE.GAUGE:
                return getGauges(id, from, end)
            default:
                return getMetrics(id, from, end)
        }
    }

    /***
     * get metrics data (first fetch)
     * @param metrics
     * @param timeRange
     * @param timestamp
     * @param isRealtime
     * @returns {Promise<unknown[]>}
     */

    async getOfflineMetricData(metrics, timeRange = 3600, timestamp, isRealtime) {
        const now = new Date().getTime()
        const fromTime = Math.round((now - timestamp) / 1000) < timeRange ? timestamp : (now - (timeRange * 1000))

        const metricsData = metrics.map(async m => {
            let mData
            if (isRealtime) {
                mData = await getMetricData(m.id, m.type, fromTime, now)
            } else {
                mData = await getMetricData(m.id, m.type)
            }
            if (mData.length === 0) {
                return {
                    ...m,
                    lastTimestamp: timestamp,
                    chartData: {
                        name: m.title,
                        data: []
                    }
                }
            }
            const lastTimestamp = get(maxBy(mData, m => m.time), 'time')
            return {
                ...m,
                lastTimestamp,
                chartData: {
                    name: m.title,
                    data: m.type === METRIC_TYPE.HISTOGRAM ? mData : getChartData(m.type, mData)
                }
            }
        })
        return await Promise.all(metricsData)
            .then(rs => rs)
            .catch(err => err)
    }
    /***
     * get metrics data interval
     * @param metrics
     * @param oldData
     * @returns {Promise<unknown[]>}
     */
    async getMetricDataPolling(metrics, oldData = []) {
        return await Promise.all(metrics.map(mtr => {
            const oldMetricData = oldData.find(o => mtr.id === get(o, ['id'], ''))
            const timestamp = get(oldMetricData, 'lastTimestamp', '')
            return getMetricData(mtr.id, mtr.type, timestamp)
                .then(mData => {
                    if (mData.length > 0) {
                        const dataByType = getDataByType(mData, mtr.type)
                        const oldMetricChartData = get(oldMetricData, ['chartData', 'data'], [])
                        const newData = [...oldMetricChartData, ...dataByType]
                        return {
                            ...oldMetricData,
                            lastTimestamp: get(orderBy(mData, ['time'], 'desc'), '[0].time'),
                            chartData: {
                                name: mtr.title,
                                data: newData
                            }
                        }
                    }
                    return oldMetricData
                })
        }))
            .then(rs => rs)
            .catch(err => err)
    }

}
