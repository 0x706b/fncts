export type Iteration = [
  value: number,
  sign: "-" | "0" | "+",
  prev: keyof IterationMap,
  next: keyof IterationMap,
  oppo: keyof IterationMap,
];

export type IterationMap = {
  __: [number, "-" | "0" | "+", "__", "__", "__"];
  "-100": [-100, "-", "__", "-99", "100"];
  "-99": [-99, "-", "-100", "-98", "99"];
  "-98": [-98, "-", "-99", "-97", "98"];
  "-97": [-97, "-", "-98", "-96", "97"];
  "-96": [-96, "-", "-97", "-95", "96"];
  "-95": [-95, "-", "-96", "-94", "95"];
  "-94": [-94, "-", "-95", "-93", "94"];
  "-93": [-93, "-", "-94", "-92", "93"];
  "-92": [-92, "-", "-93", "-91", "92"];
  "-91": [-91, "-", "-92", "-90", "91"];
  "-90": [-90, "-", "-91", "-89", "90"];
  "-89": [-89, "-", "-90", "-88", "89"];
  "-88": [-88, "-", "-89", "-87", "88"];
  "-87": [-87, "-", "-88", "-86", "87"];
  "-86": [-86, "-", "-87", "-85", "86"];
  "-85": [-85, "-", "-86", "-84", "85"];
  "-84": [-84, "-", "-85", "-83", "84"];
  "-83": [-83, "-", "-84", "-82", "83"];
  "-82": [-82, "-", "-83", "-81", "82"];
  "-81": [-81, "-", "-82", "-80", "81"];
  "-80": [-80, "-", "-81", "-79", "80"];
  "-79": [-79, "-", "-80", "-78", "79"];
  "-78": [-78, "-", "-79", "-77", "78"];
  "-77": [-77, "-", "-78", "-76", "77"];
  "-76": [-76, "-", "-77", "-75", "76"];
  "-75": [-75, "-", "-76", "-74", "75"];
  "-74": [-74, "-", "-75", "-73", "74"];
  "-73": [-73, "-", "-74", "-72", "73"];
  "-72": [-72, "-", "-73", "-71", "72"];
  "-71": [-71, "-", "-72", "-70", "71"];
  "-70": [-70, "-", "-71", "-69", "70"];
  "-69": [-69, "-", "-70", "-68", "69"];
  "-68": [-68, "-", "-69", "-67", "68"];
  "-67": [-67, "-", "-68", "-66", "67"];
  "-66": [-66, "-", "-67", "-65", "66"];
  "-65": [-65, "-", "-66", "-64", "65"];
  "-64": [-64, "-", "-65", "-63", "64"];
  "-63": [-63, "-", "-64", "-62", "63"];
  "-62": [-62, "-", "-63", "-61", "62"];
  "-61": [-61, "-", "-62", "-60", "61"];
  "-60": [-60, "-", "-61", "-59", "60"];
  "-59": [-59, "-", "-60", "-58", "59"];
  "-58": [-58, "-", "-59", "-57", "58"];
  "-57": [-57, "-", "-58", "-56", "57"];
  "-56": [-56, "-", "-57", "-55", "56"];
  "-55": [-55, "-", "-56", "-54", "55"];
  "-54": [-54, "-", "-55", "-53", "54"];
  "-53": [-53, "-", "-54", "-52", "53"];
  "-52": [-52, "-", "-53", "-51", "52"];
  "-51": [-51, "-", "-52", "-50", "51"];
  "-50": [-50, "-", "-51", "-49", "50"];
  "-49": [-49, "-", "-50", "-48", "49"];
  "-48": [-48, "-", "-49", "-47", "48"];
  "-47": [-47, "-", "-48", "-46", "47"];
  "-46": [-46, "-", "-47", "-45", "46"];
  "-45": [-45, "-", "-46", "-44", "45"];
  "-44": [-44, "-", "-45", "-43", "44"];
  "-43": [-43, "-", "-44", "-42", "43"];
  "-42": [-42, "-", "-43", "-41", "42"];
  "-41": [-41, "-", "-42", "-40", "41"];
  "-40": [-40, "-", "-41", "-39", "40"];
  "-39": [-39, "-", "-40", "-38", "39"];
  "-38": [-38, "-", "-39", "-37", "38"];
  "-37": [-37, "-", "-38", "-36", "37"];
  "-36": [-36, "-", "-37", "-35", "36"];
  "-35": [-35, "-", "-36", "-34", "35"];
  "-34": [-34, "-", "-35", "-33", "34"];
  "-33": [-33, "-", "-34", "-32", "33"];
  "-32": [-32, "-", "-33", "-31", "32"];
  "-31": [-31, "-", "-32", "-30", "31"];
  "-30": [-30, "-", "-31", "-29", "30"];
  "-29": [-29, "-", "-30", "-28", "29"];
  "-28": [-28, "-", "-29", "-27", "28"];
  "-27": [-27, "-", "-28", "-26", "27"];
  "-26": [-26, "-", "-27", "-25", "26"];
  "-25": [-25, "-", "-26", "-24", "25"];
  "-24": [-24, "-", "-25", "-23", "24"];
  "-23": [-23, "-", "-24", "-22", "23"];
  "-22": [-22, "-", "-23", "-21", "22"];
  "-21": [-21, "-", "-22", "-20", "21"];
  "-20": [-20, "-", "-21", "-19", "20"];
  "-19": [-19, "-", "-20", "-18", "19"];
  "-18": [-18, "-", "-19", "-17", "18"];
  "-17": [-17, "-", "-18", "-16", "17"];
  "-16": [-16, "-", "-17", "-15", "16"];
  "-15": [-15, "-", "-16", "-14", "15"];
  "-14": [-14, "-", "-15", "-13", "14"];
  "-13": [-13, "-", "-14", "-12", "13"];
  "-12": [-12, "-", "-13", "-11", "12"];
  "-11": [-11, "-", "-12", "-10", "11"];
  "-10": [-10, "-", "-11", "-9", "10"];
  "-9": [-9, "-", "-10", "-8", "9"];
  "-8": [-8, "-", "-9", "-7", "8"];
  "-7": [-7, "-", "-8", "-6", "7"];
  "-6": [-6, "-", "-7", "-5", "6"];
  "-5": [-5, "-", "-6", "-4", "5"];
  "-4": [-4, "-", "-5", "-3", "4"];
  "-3": [-3, "-", "-4", "-2", "3"];
  "-2": [-2, "-", "-3", "-1", "2"];
  "-1": [-1, "-", "-2", "0", "1"];
  "0": [0, "0", "-1", "1", "0"];
  "1": [1, "+", "0", "2", "-1"];
  "2": [2, "+", "1", "3", "-2"];
  "3": [3, "+", "2", "4", "-3"];
  "4": [4, "+", "3", "5", "-4"];
  "5": [5, "+", "4", "6", "-5"];
  "6": [6, "+", "5", "7", "-6"];
  "7": [7, "+", "6", "8", "-7"];
  "8": [8, "+", "7", "9", "-8"];
  "9": [9, "+", "8", "10", "-9"];
  "10": [10, "+", "9", "11", "-10"];
  "11": [11, "+", "10", "12", "-11"];
  "12": [12, "+", "11", "13", "-12"];
  "13": [13, "+", "12", "14", "-13"];
  "14": [14, "+", "13", "15", "-14"];
  "15": [15, "+", "14", "16", "-15"];
  "16": [16, "+", "15", "17", "-16"];
  "17": [17, "+", "16", "18", "-17"];
  "18": [18, "+", "17", "19", "-18"];
  "19": [19, "+", "18", "20", "-19"];
  "20": [20, "+", "19", "21", "-20"];
  "21": [21, "+", "20", "22", "-21"];
  "22": [22, "+", "21", "23", "-22"];
  "23": [23, "+", "22", "24", "-23"];
  "24": [24, "+", "23", "25", "-24"];
  "25": [25, "+", "24", "26", "-25"];
  "26": [26, "+", "25", "27", "-26"];
  "27": [27, "+", "26", "28", "-27"];
  "28": [28, "+", "27", "29", "-28"];
  "29": [29, "+", "28", "30", "-29"];
  "30": [30, "+", "29", "31", "-30"];
  "31": [31, "+", "30", "32", "-31"];
  "32": [32, "+", "31", "33", "-32"];
  "33": [33, "+", "32", "34", "-33"];
  "34": [34, "+", "33", "35", "-34"];
  "35": [35, "+", "34", "36", "-35"];
  "36": [36, "+", "35", "37", "-36"];
  "37": [37, "+", "36", "38", "-37"];
  "38": [38, "+", "37", "39", "-38"];
  "39": [39, "+", "38", "40", "-39"];
  "40": [40, "+", "39", "41", "-40"];
  "41": [41, "+", "40", "42", "-41"];
  "42": [42, "+", "41", "43", "-42"];
  "43": [43, "+", "42", "44", "-43"];
  "44": [44, "+", "43", "45", "-44"];
  "45": [45, "+", "44", "46", "-45"];
  "46": [46, "+", "45", "47", "-46"];
  "47": [47, "+", "46", "48", "-47"];
  "48": [48, "+", "47", "49", "-48"];
  "49": [49, "+", "48", "50", "-49"];
  "50": [50, "+", "49", "51", "-50"];
  "51": [51, "+", "50", "52", "-51"];
  "52": [52, "+", "51", "53", "-52"];
  "53": [53, "+", "52", "54", "-53"];
  "54": [54, "+", "53", "55", "-54"];
  "55": [55, "+", "54", "56", "-55"];
  "56": [56, "+", "55", "57", "-56"];
  "57": [57, "+", "56", "58", "-57"];
  "58": [58, "+", "57", "59", "-58"];
  "59": [59, "+", "58", "60", "-59"];
  "60": [60, "+", "59", "61", "-60"];
  "61": [61, "+", "60", "62", "-61"];
  "62": [62, "+", "61", "63", "-62"];
  "63": [63, "+", "62", "64", "-63"];
  "64": [64, "+", "63", "65", "-64"];
  "65": [65, "+", "64", "66", "-65"];
  "66": [66, "+", "65", "67", "-66"];
  "67": [67, "+", "66", "68", "-67"];
  "68": [68, "+", "67", "69", "-68"];
  "69": [69, "+", "68", "70", "-69"];
  "70": [70, "+", "69", "71", "-70"];
  "71": [71, "+", "70", "72", "-71"];
  "72": [72, "+", "71", "73", "-72"];
  "73": [73, "+", "72", "74", "-73"];
  "74": [74, "+", "73", "75", "-74"];
  "75": [75, "+", "74", "76", "-75"];
  "76": [76, "+", "75", "77", "-76"];
  "77": [77, "+", "76", "78", "-77"];
  "78": [78, "+", "77", "79", "-78"];
  "79": [79, "+", "78", "80", "-79"];
  "80": [80, "+", "79", "81", "-80"];
  "81": [81, "+", "80", "82", "-81"];
  "82": [82, "+", "81", "83", "-82"];
  "83": [83, "+", "82", "84", "-83"];
  "84": [84, "+", "83", "85", "-84"];
  "85": [85, "+", "84", "86", "-85"];
  "86": [86, "+", "85", "87", "-86"];
  "87": [87, "+", "86", "88", "-87"];
  "88": [88, "+", "87", "89", "-88"];
  "89": [89, "+", "88", "90", "-89"];
  "90": [90, "+", "89", "91", "-90"];
  "91": [91, "+", "90", "92", "-91"];
  "92": [92, "+", "91", "93", "-92"];
  "93": [93, "+", "92", "94", "-93"];
  "94": [94, "+", "93", "95", "-94"];
  "95": [95, "+", "94", "96", "-95"];
  "96": [96, "+", "95", "97", "-96"];
  "97": [97, "+", "96", "98", "-97"];
  "98": [98, "+", "97", "99", "-98"];
  "99": [99, "+", "98", "100", "-99"];
  "100": [100, "+", "99", "__", "-100"];
};

export type IterationOf<N extends number> = `${N}` extends keyof IterationMap
  ? IterationMap[`${N}`]
  : IterationMap["__"];

export type Next<I extends Iteration> = IterationMap[I[3]];

export type Prev<I extends Iteration> = IterationMap[I[2]];

export type Pos<I extends Iteration> = I[0];

export type Key<I extends Iteration> = `${Pos<I>}`;
