import Control from './charts/Chart.Control'
import controlChartController from './controllers/controller.control-chart'

Chart.ControlChart = Control
Chart.controllers.controlChart = controlChartController
Chart.defaults.global.maintainAspectRatio = false;

var { Component, Rect } = scene

export { Chart }
