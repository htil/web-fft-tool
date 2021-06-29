# web-fft-tool
A website designed to teach students about Fast Fourier Transforms. Includes an educational module and interactive FFT visualization tool. Also contains an additional tool 

Feel free to add ideas to the To-do List!

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
- [ ] Verification of text input
- [ ] Different kinds of waveforms (square, sawtooth, triangle, etc)
#### Research Tool
- [ ] Add ability to upload .csv file
- [ ] Add field to set sampling frequency
- [ ] Make FFT graph interactive
  - [ ]  Display frequency/amplitude on mouseover
- [ ]  Improve layout of statistics summary
- [ ]  Transpose data from .csv file

### Data File Format
As of now, you need a .csv file that has the channel names in the first row and the data in the subsequent rows.
For example: 
| Fp1 | Fpz | Fp2 | F7  | ... |
| --- | --- | --- | --- | --- |
| -23013.229 | -10070.824 | -528.804 | -4324.317 | ... |
|-23005.303 | -10062.254 | -520.014 | -4318.083 | ... |
| ... | ... | ... | ... | ... |

---

Created for the 2021 Engineering Sensors, Systems, and Signal Processing for Speech Pathology REU project
