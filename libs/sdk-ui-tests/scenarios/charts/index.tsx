// (C) 2007-2019 GoodData Corporation

import areaChart from "./areaChart";
import barChart from "./barChart";
import bubbleChart from "./bubbleChart";
import columnChart from "./columnChart";
import comboChart from "./comboChart";
import donutChart from "./donutChart";
import funnelChart from "./funnelChart/base";
import headline from "./headline/base";
import heatmap from "./heatmap/base";
import lineChart from "./lineChart/base";
import pieChart from "./pieChart";
import scatterPlot from "./scatterPlot/base";
import treemap from "./treemap/base";

export default [
    ...areaChart,
    ...barChart,
    ...bubbleChart,
    ...columnChart,
    ...comboChart,
    ...donutChart,
    funnelChart,
    headline,
    heatmap,
    lineChart,
    ...pieChart,
    scatterPlot,
    treemap,
];
