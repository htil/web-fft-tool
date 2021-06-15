# eeg-web-viz
Scripts for EEG Visualization using Javascript  

Feel free to add ideas to the To-do List!

### To-do List

- [ ] Raw Plot
  - [x] Single Channel Display
  - [ ] Stacked/Multi-channel Display
- [x] Add sliding window
- [ ] Extract raw data from sliding window
- [ ] Calculate FFT from window
- [ ] Output result of FFT/bandpower
- [ ] Convert to library?
- [ ] Come up with a cooler name for the repo :sunglasses:

### Instructions
1. Clone the repo
2. Put your .csv file in the same directory
3. Update the JS code to reflect the new .csv file name
4. Open the .html file

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
