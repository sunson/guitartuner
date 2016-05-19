var source, fft;
var bNormalize = true;
var centerClip = false;

function noteFromPitch( frequency ) {
    var noteText = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2' ];
    var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
    var nnum = Math.round( noteNum ) + 69;
    var note = nnum % 12;
    return noteText[note];
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    fill(255);
    noStroke();
    textAlign(CENTER);

    source = new p5.AudioIn();
    source.start();

    fft = new p5.FFT();
    fft.setInput(source);

}

function draw() {
    background(100);

    // array of values from -1 to 1
    var timeDomain = fft.waveform(2048, 'float32');
    var corrBuff = autoCorrelate(timeDomain);
    var freq = findFrequency(corrBuff);
    textSize(100);
    text("" + noteFromPitch(freq), width / 2, height / 2);
}


function autoCorrelate(buffer) {
    var newBuffer = [];
    var nSamples = buffer.length;

    var autocorrelation = [];

    // center clip removes any samples under 0.1
    if (centerClip) {
        var cutoff = 0.1;
        for (var i = 0; i < buffer.length; i++) {
            var val = buffer[i];
            buffer[i] = Math.abs(val) > cutoff ? val : 0;
        }
    }

    for (var lag = 0; lag < nSamples; lag++){
        var sum = 0;
        for (var index = 0; index < nSamples; index++){
            var indexLagged = index+lag;
            if (indexLagged < nSamples){
                var sound1 = buffer[index];
                var sound2 = buffer[indexLagged];
                var product = sound1 * sound2;
                sum += product;
            }
        }

        // average to a value between -1 and 1
        newBuffer[lag] = sum/nSamples;
    }

    if (bNormalize){
        var biggestVal = 0;
        for (var index = 0; index < nSamples; index++){
            if (abs(newBuffer[index]) > biggestVal){
                biggestVal = abs(newBuffer[index]);
            }
        }
        for (var index = 0; index < nSamples; index++){
            newBuffer[index] /= biggestVal;
        }
    }

    return newBuffer;
}


function findFrequency(autocorr) {

  var nSamples = autocorr.length;
  var valOfLargestPeakSoFar = 0;
  var indexOfLargestPeakSoFar = -1;

  for (var index = 1; index < nSamples; index++){
    var valL = autocorr[index-1];
    var valC = autocorr[index];
    var valR = autocorr[index+1];

    var bIsPeak = ((valL < valC) && (valR < valC));
    if (bIsPeak){
      if (valC > valOfLargestPeakSoFar){
        valOfLargestPeakSoFar = valC;
        indexOfLargestPeakSoFar = index;
      }
    }
  }
  
  var distanceToNextLargestPeak = indexOfLargestPeakSoFar - 0;

  // convert sample count to frequency
  var fundamentalFrequency = sampleRate() / distanceToNextLargestPeak;
  return fundamentalFrequency;
}
