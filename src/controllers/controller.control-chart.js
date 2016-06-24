Chart.defaults.controlChart = Chart.defaults.line;
// TODO: Chart.js에 label exclude 기능이 추가되면 아래의 기능을 제거한다.
Chart.defaults.controlChart.legend = {
  labels: {
    generateLabels: function (chart) {
      var data = chart.data;

      var helpers = Chart.helpers;

      return helpers.isArray(data.datasets) ? data.datasets.map(function (dataset, i) {

        if (dataset.showInLegend === false)
          return null;

        return {
          text: dataset.label,
          fillStyle: (!helpers.isArray(dataset.backgroundColor) ? dataset.backgroundColor : dataset.backgroundColor[0]),
          hidden: !chart.isDatasetVisible(i),
          lineCap: dataset.borderCapStyle,
          lineDash: dataset.borderDash,
          lineDashOffset: dataset.borderDashOffset,
          lineJoin: dataset.borderJoinStyle,
          lineWidth: dataset.borderWidth,
          strokeStyle: dataset.borderColor,

          // Below is extra data used for toggling the datasets
          datasetIndex: i
        };
      }, this) : [];
    }
  }
};

function initControlChart(chartInstance) {
  chartInstance.chartSeries = [];

  for(let dataset of chartInstance.data.datasets) {
    chartInstance.chartSeries.push(dataset);
  }

  chartInstance.controlLimitSeries = {
    ucl : null,
    cl : null,
    lcl : null
  };
  chartInstance.specLines = {
    usl : null,
    lsl : null
  };

  chartInstance.chart.width = chartInstance.width;
  chartInstance.chart.height = chartInstance.width;
}

function excludeNullValueLabel(chartInstance) {
  // TODO: Chart.js에 label exclude 기능이 추가되면 아래의 기능을 제거한다.
  chartInstance.legend.buildLabels = function () {
    var me = this;
    var legendItemsArr = me.options.labels.generateLabels.call(me, me.chart);
    me.legendItems = [];

    for (let legendItem of legendItemsArr) {
      if (legendItem == null)
        continue;

      me.legendItems.push(legendItem);
    }

    if (me.options.reverse) {
      me.legendItems.reverse();
    }
  }
}

function generateSpecLines(chartInstance) {

  generateUpperControlLine(chartInstance);
  generateLowerControlLine(chartInstance);
  generateCenterLine(chartInstance);

}

function generateUpperControlLine (chartInstance) {
  var data = [];
  var dataLength = chartInstance.data.labels.length;

  var spcData = chartInstance.data.spcData;
  if(spcData){
    data = spcData.ucl;
  }

  chartInstance.controlLimitSeries.ucl = generateSPCLine(chartInstance, data);
}

function generateLowerControlLine(chartInstance) {
  var data = [];
  var dataLength = chartInstance.data.labels.length;

  var spcData = chartInstance.data.spcData;
  if(spcData){
    data = spcData.lcl;
  }

  chartInstance.controlLimitSeries.lcl = generateSPCLine(chartInstance, data);
}

function generateCenterLine(chartInstance) {
  var data = [];
  var dataLength = chartInstance.data.labels.length;

  var spcData = chartInstance.data.spcData;
  if(spcData){
    data = spcData.cl;
  }

  chartInstance.controlLimitSeries.cl = generateSPCLine(chartInstance, data, {
    borderColor: "rgba(25,220,150,1)",
    borderWidth: 2,
    borderDash: [0]
  });
}

function generateSPCLine(chart, data, options) {
  var obj = {
    showInLegend: false,
    fill: false,
    lineTension: 0,
    borderWidth: 1,
    borderDash: [10, 10, 2, 10],
    // borderDashOffset: 5,
    backgroundColor: "rgba(220,92,92,0.4)",
    borderColor: "rgba(220,92,92,1)",
    borderCapStyle: 'butt',
    borderJoinStyle: 'miter',
    pointBorderColor: "rgba(220,92,92,1)",
    pointBackgroundColor: "#fff",
    pointBorderWidth: 0,
    pointHoverRadius: 0,
    pointHoverBackgroundColor: "rgba(220,92,92,1)",
    pointHoverBorderColor: "rgba(220,220,220,1)",
    pointHoverBorderWidth: 0,
    pointRadius: 0,
    pointHitRadius: 0,
    data: data || []
  };

  if (options)
    Object.assign(obj, options);

  chart.data.datasets.push(obj);
  return obj;
}

function updateSPCDatas(chartInstance) {
  var spcData = chartInstance.data.spcData;
  let controlLimits = chartInstance.controlLimitSeries;

  for(let key in spcData) {

    if(spcData[key]) {
      if(spcData[key].length > 0 && controlLimits[key]._meta[chartInstance.id].data.length === spcData[key].length){
        controlLimits[key]._meta[chartInstance.id].data.shift(1);
      }
    }

    controlLimits[key].data = spcData[key] || [];
  }
}


function updatePointColor(chartInstance) {
  for(let i in chartInstance.chartSeries) {
    checkOOC(chartInstance, i);
  }
  console.log(chartInstance.chartSeries[0]._meta[chartInstance.id].data[0]._model.borderColor)
  chartInstance.chartSeries[0]._meta[chartInstance.id].data[0]._model.borderColor="rgba(255,0,0,1)"
}

function checkOOC(dataArr, spcDataObject, currIndex) {
  console.log(dataArr, spcDataObject, currIndex);
  // var spcData = chartInstance.data.spcData;
  //
  // for(let i in chartInstance.chartSeries._meta) {
  //
  //   if(chartInstance.chartSeries._meta[i].data[index] > spcData[i]){
  //
  //   }
  // }
}

function checkOOCs(chartInstance) {
  let spcData = chartInstance.config.data.spcData;
  let seriesData = chartInstance.config.data.seriesData;

  for (let i in seriesData[0].data) {
    checkOOC(seriesData[0].data, spcData, i);
  }

  // for(let i in seriesData) {
  //   let data = seriesData[i]
  //   console.log(chartInstance)
  //   console.log(chartInstance.chartSeries[i]._meta[chartInstance.id].data)
  //
  // }
  //
  // console.log(chartInstance)
  // for(let i in chartInstance.chartSeries) {
  //   let d = chartInstance.chartSeries[i]
  //
  // }
}

Chart.plugins.register({
  beforeInit : function(chartInstance){
    if(chartInstance.config.type === "controlChart"){
      initControlChart(chartInstance);
      excludeNullValueLabel(chartInstance);
      generateSpecLines(chartInstance);
    }
  },

  beforeUpdate : function(chartInstance){
    if(chartInstance.config.type === "controlChart"){
      var spcData = chartInstance.data.spcData;
      let seriesData = chartInstance.data.seriesData;
      let controlLimits = chartInstance.controlLimitSeries;

      if(!spcData || Object.keys(spcData).length === 0) {
        spcData = {
          ucl : null,
          cl: null,
          lcl : null
        }
      }

      updateSPCDatas(chartInstance);
    }
  },
  afterUpdate: function(chartInstance){
    checkOOCs(chartInstance);
    // updatePointColor(chartInstance);
  }
});

export default class controlChart extends Chart.controllers.line {

  constructor(chart, datasetIndex) {

    super(chart, datasetIndex);

  }

  static get datasetElementType() {
    return Chart.elements.Line
  }

  static get dataElementType() {
    return Chart.elements.Point
  }

  initialize(chart, datasetIndex) {
    super.initialize.call(this, chart, datasetIndex);
  }

}
