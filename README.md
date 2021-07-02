# web-fft-tool
A website designed to teach students about Fast Fourier Transforms. Includes an educational module and interactive FFT visualization tool. Also contains an additional tool to upload your own data.

### Local Installation
- Clone/download the repo
- Unzip the folder
- Open the index.html in your preferred browser
  - It is recommended you use the latest version of Chrome, Firefox, or Edge.

### Data File Format
As of now, you need a .csv file that has column names in the first row and the data in the subsequent rows.
For example: 
| Fp1 | Fpz | Fp2 | F7  | ... |
| --- | --- | --- | --- | --- |
| -23013.229 | -10070.824 | -528.804 | -4324.317 | ... |
|-23005.303 | -10062.254 | -520.014 | -4318.083 | ... |
| ... | ... | ... | ... | ... |

### To-do List
#### General
- [x] Raw Plot
- [x] Add sliding window
- [x] Extract raw data from sliding window
- [x] Calculate FFT from window
- [x] Output and graph result of FFT
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
- [ ] Make FFT graph interactive
  - [ ]  Display frequency/amplitude on mouseover
- [ ]  Improve layout of statistics summary
- [ ]  Transpose data from .csv file


---

Created for the 2021 Engineering Sensors, Systems, and Signal Processing for Speech Pathology REU project
