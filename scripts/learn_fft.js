


//Get the button:
mybutton = document.getElementById("myBtn");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
function validate(question){
  if ( $("#"+question+"_rightAnswer").is(":checked")){
      $("#"+question+"_Correct").show();
      $("#"+question+"_Incorrect").hide();
      }
     else if ( $("#"+question).is(":checked")){
        $("#"+question+"_Correct").hide();
        $("#"+question+"_Incorrect").show();
        }
      
  }
var submitAnswer = function() {

  
    //Usage example
    validate("2b");
    validate("2c");
    validate("3b");
    validate("4b");
    validate("4d");
    
  
  
  /*
  var radios = document.getElementsByName('choice');
  var val= "";
  for (var i = 0, length = radios.length; i < length; i++) {
      if (radios[i].checked) {
         val = radios[i].value; 
         break;
       }
  }
  
  if (val == "" ) {
    alert('please select choice answer');
  } else if ( val == "Shorter length" ) {
    alert('Answer is correct !');
  } else {
    alert('Answer is wrong');
  }*/
};