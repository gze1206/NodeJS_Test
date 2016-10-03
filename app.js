var express = require('express');

var app = express();

function fizzBuzz()
{
  for (i=1; i<=100; i++)
  {
    if (i%3 === 0 && i%5 === 0)
    {
      res.sned('fizzBuzz');
    }
    else if (i%3 === 0)
    {
      res.send('Fizz');
    }
    else if (i%5 === 0)
    {
      res.send('Buzz');
    }
    else res.send(i);
  }
}

app.get('/', function (req,res) {
  res.send('Hello World!');
  fizzBuzz();
});

app.listen(3000, function () {
  console.log('Server On!');
});
