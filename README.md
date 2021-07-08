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
- [jquery.fft](https://github.com/hotstaff/jquery.fft)
- [PhET Wave on a String Simiulation](https://phet.colorado.edu/en/simulation/wave-on-a-string)

---

### To-do List
#### General
- [x] Raw Plot
- [x] Add sliding window
- [x] Extract raw data from sliding window
- [x] Calculate FFT from window
- [x] Output and graph result of FFT
- [x] Add citations for simulations and libraries
- [ ] Come up with a cooler name for the repo :sunglasses:
#### Educational tool
- [x] Add ability to generate signal using bci.js
- [x] Amplitude slider/input
- [x] Frequency slider/input
- [x] Verification of text input
- [ ] Different kinds of waveforms (square, sawtooth, triangle, etc)
#### Research Tool
- [x] Add ability to upload .csv file
- [x] Add field to set sampling frequency
- [x]  Add feature to view data from file
- [x]  Add ability to use time data from file
- [ ] Make FFT graph interactive
  - [ ]  Display frequency/amplitude on mouseover

---

Created for the 2021 Engineering Sensors, Systems, and Signal Processing for Speech Pathology REU project
