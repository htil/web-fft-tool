# web-fft-tool
A website designed to teach students about Fast Fourier Transforms. Includes an educational module and interactive FFT visualization tool. Also contains an additional "advanced" tool to upload your own data.

## Local Installation
- Clone/download the repo
- Unzip the folder
- Open the **index.html** in your preferred browser
  - It is recommended you use the latest version of Chrome, Firefox, or Edge.

## Data File Format
Please use the following format for your .csv file that has column names in the first row and the data in the subsequent rows.  
For example: 
| Fp1 | Fpz | Fp2 | F7  | ... |
| --- | --- | --- | --- | --- |
| -23013.229 | -10070.824 | -528.804 | -4324.317 | ... |
|-23005.303 | -10062.254 | -520.014 | -4318.083 | ... |
| ... | ... | ... | ... | ... |

Alternatively, you can specify time in the first column. If you choose this, please make sure to check the box when uploading your file. The units on the graph will reflect the same units as the data in the first column.  
For example: 
| Time | Fp1 | Fpz | Fp2 | F7  | ... |
| --- | --- | --- | --- | --- | --- |
| 0 | -23013.229 | -10070.824 | -528.804 | -4324.317 | ... |
| 0.1 |-23005.303 | -10062.254 | -520.014 | -4318.083 | ... |
| 0.2 | ... | ... | ... | ... | ... |

## Citations/Credits
The following libraries and resources were used to develop this project
- [d3.js](https://d3js.org/)
- [bci.js](https://bci.js.org/)
- [dsp.js](https://github.com/corbanbrook/dsp.js)
- [PhET Wave on a String Simulation](https://phet.colorado.edu/en/simulation/wave-on-a-string)

---

Created for the 2021 Engineering Sensors, Systems, and Signal Processing for Speech Pathology REU project
