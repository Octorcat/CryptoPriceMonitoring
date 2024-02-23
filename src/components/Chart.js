import React from "react";
import Chart from "react-apexcharts";
import '../style/style.css'

function getGraphData(graphVal) {
  let minVal = Math.min(...graphVal);
  let maxVal = Math.max(...graphVal);
  let allSame = false
  if (maxVal === minVal) {
    allSame = true
  }
  let arr = []
  for (let index = 0; index < graphVal.length; index++) {
    var timestamp = new Date(new Date().setDate(new Date().getDate() - index)).getTime()
    if(allSame) {
      arr.push([timestamp, maxVal])
    } else {
      arr.push([timestamp, graphVal[graphVal.length - 1 - index]])
    }
  }
  return {arr, maxVal, allSame};
}


function LineChart ({graphVal}) {
  const graphdata = getGraphData(graphVal)
  const state = {
    series: [{
      data: graphdata.arr,
      name: 'price'
    }],
    options: {
      chart: {
        id: 'area-datetime',
        type: 'line',
        zoom: {
          enabled: false,
          autoScaleYaxis: true
        },
        toolbar: {
          show: false
        },
      },
      grid: {
        show: false
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        tooltip: {
          enabled: false
        },
        type: 'datetime',
        tickAmount: 6,
        labels: {
          show: false
        },
        axisBorder: {
          show: false
        },
        crosshairs: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        show: false,
        min: 0,
        max: graphdata.allSame ? (graphdata.maxVal === 0 ? 1 : graphdata.maxVal * 2) : graphdata.maxVal
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy'
        },
        y: {
          formatter: value => value.toFixed(2)
        },
      },
      colors: ['#52B58A']
    }
  }
  return (
    <Chart className="polyLine-width" options={state.options} series={state.series} type="line" height={80} style={{marginTop: '-15px'}} />
  )
}

export default LineChart;
