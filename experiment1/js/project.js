// project.js - purpose and description here
// Author: Your Name
// Date:

// NOTE: This is how we might start a basic JavaaScript OOP project

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

// define a class
class MyProjectClass {
  // constructor function
  constructor(param1, param2) {
    // set properties using 'this' keyword
    this.property1 = param1;
    this.property2 = param2;
  }
  
  // define a method
  myMethod() {
    // code to run when method is called
  }
}

function main() {
  // // create an instance of the class
  // let myInstance = new MyProjectClass("value1", "value2");

  // // call a method on the instance
  // myInstance.myMethod();

  const fillers = {
    male_baby: ["Jeff", "Joe", "Josh", "Kyle", "John"],
    female_baby: ["Monica","Monique", "Kiara", "Sarah"],
    unisex_baby: ["Alex", "Abe", "Charlie", "Sam", "Taylor"],
     
  };
  
  const template = `
  If your baby is a boy or has a genital of the male sex, I suggest you name it $male_baby.
  If your baby is a girl or has a genital of the female sex, I suggest you name it $female_baby.
  If you want a name that could be either considered as male or female, I suggest you name it $unisex_baby.
  `;
  
  
  // STUDENTS: You don't need to edit code below this line.
  
  const slotPattern = /\$(\w+)/;
  
  // function replacer(match, name) {
  //   let options = fillers[name];
  //   if (options) {
  //     return options[Math.floor(Math.random() * options.length)];
  //   } else {
  //     return `<UNKNOWN:${name}>`;
  //   }
  // }
  function replacer(match, name) {
    let options = fillers[name];
    if (options) {
      const colorMap = {
        male_baby: "blue",
        female_baby: "hotpink",
        unisex_baby: "green",
      };
      const color = colorMap[name] || "black";
      const chosen = options[Math.floor(Math.random() * options.length)];
      return `<span style="color: ${color};">${chosen}</span>`;
    } else {
      return `<UNKNOWN:${name}>`;
    }
  }
  
  
  function generate() {
    let story = template;
    while (story.match(slotPattern)) {
      story = story.replace(slotPattern, replacer);
    }
  
    /* global box */
    // box.innerText = story;
    // $("#box").text(story);
    $("#box").html(story.replace(/\n/g, "<br>"));
  }
  
  /* global clicker */
  // clicker.onclick = generate;
  $("#clicker").click(generate);
  
  generate();
  
}

// let's get this party started - uncomment me
main();