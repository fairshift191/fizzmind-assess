/**
 * Python Assessment Test — Kid-friendly questions
 * 30 questions pool, 20 randomly selected per test
 * Written for 8-16 year olds — fun examples, simple language, relatable context
 */

export const QUESTION_POOL = [
  {
    id: 1,
    question: 'What will Python show when you run this?\n\nprint("Hello!")',
    options: ['Hello!', 'print Hello!', 'Nothing happens', '"Hello!"'],
    correct: 0,
    topic: 'Basics',
  },
  {
    id: 2,
    question: 'You want to save your age in Python. Which one is correct?',
    options: ['age == 11', 'age = 11', 'age: 11', 'set age to 11'],
    correct: 1,
    topic: 'Variables',
  },
  {
    id: 3,
    question: 'What does this code print?\n\nfavorite = "pizza"\nprint(favorite)',
    options: ['favorite', 'pizza', '"pizza"', 'Nothing'],
    correct: 1,
    topic: 'Variables',
  },
  {
    id: 4,
    question: 'Which of these is a LIST in Python?',
    options: ['colors = "red, blue"', 'colors = (red, blue)', 'colors = [\"red\", \"blue\"]', 'colors = red + blue'],
    correct: 2,
    topic: 'Lists',
  },
  {
    id: 5,
    question: 'You have a list of snacks:\n\nsnacks = [\"chips\", \"cookies\", \"fruit\"]\n\nHow do you find out how many snacks are in the list?',
    options: ['snacks.count()', 'size(snacks)', 'len(snacks)', 'snacks.total()'],
    correct: 2,
    topic: 'Lists',
  },
  {
    id: 6,
    question: 'What does this print?\n\nprint(5 + 3)',
    options: ['5 + 3', '53', '8', 'five plus three'],
    correct: 2,
    topic: 'Math',
  },
  {
    id: 7,
    question: 'What symbol do we use to multiply in Python?',
    options: ['x', '*', '×', 'mul'],
    correct: 1,
    topic: 'Math',
  },
  {
    id: 8,
    question: 'What will this print?\n\nname = \"Sam\"\nprint(\"Hi \" + name)',
    options: ['Hi name', 'Hi + Sam', 'Hi Sam', 'Error'],
    correct: 2,
    topic: 'Strings',
  },
  {
    id: 9,
    question: 'How do you start an if-statement in Python?',
    options: ['if (x = 5):', 'if x == 5:', 'if x equals 5', 'when x is 5:'],
    correct: 1,
    topic: 'If Statements',
  },
  {
    id: 10,
    question: 'What does == mean in Python?',
    options: ['Give a value', 'Is equal to (checking)', 'Plus', 'Equals sign for math'],
    correct: 1,
    topic: 'If Statements',
  },
  {
    id: 11,
    question: 'What will this print?\n\nage = 11\nif age >= 10:\n    print(\"You can join!\")\nelse:\n    print(\"Too young\")',
    options: ['You can join!', 'Too young', 'Both', 'Error'],
    correct: 0,
    topic: 'If Statements',
  },
  {
    id: 12,
    question: 'What does this loop do?\n\nfor i in range(3):\n    print(\"Go!\")',
    options: ['Prints "Go!" once', 'Prints "Go!" 3 times', 'Prints "Go!" forever', 'Prints the number 3'],
    correct: 1,
    topic: 'Loops',
  },
  {
    id: 13,
    question: 'What numbers does range(4) give you?',
    options: ['1, 2, 3, 4', '0, 1, 2, 3', '0, 1, 2, 3, 4', '4, 3, 2, 1'],
    correct: 1,
    topic: 'Loops',
  },
  {
    id: 14,
    question: 'How do you add \"grape\" to this list?\n\nfruits = [\"apple\", \"banana\"]',
    options: ['fruits + \"grape\"', 'fruits.add(\"grape\")', 'fruits.append(\"grape\")', 'fruits.insert(\"grape\")'],
    correct: 2,
    topic: 'Lists',
  },
  {
    id: 15,
    question: 'Which line is a comment (a note for yourself that Python ignores)?',
    options: ['// this is a note', '# this is a note', '/* this is a note */', '-- this is a note'],
    correct: 1,
    topic: 'Basics',
  },
  {
    id: 16,
    question: 'What keyword do you use to create a function?',
    options: ['function', 'fun', 'def', 'create'],
    correct: 2,
    topic: 'Functions',
  },
  {
    id: 17,
    question: 'What will this print?\n\ndef say_hi():\n    print(\"Hey there!\")\n\nsay_hi()',
    options: ['say_hi', 'Hey there!', 'def say_hi', 'Nothing'],
    correct: 1,
    topic: 'Functions',
  },
  {
    id: 18,
    question: 'What\'s wrong with this code?\n\nif score > 100\n    print(\"High score!\")',
    options: ['Missing colon : after the if line', 'score should be in quotes', 'print is spelled wrong', 'Nothing is wrong'],
    correct: 0,
    topic: 'Debugging',
  },
  {
    id: 19,
    question: 'What does this code print?\n\npets = [\"dog\", \"cat\", \"fish\"]\nprint(pets[0])',
    options: ['dog', 'cat', '0', 'pets'],
    correct: 0,
    topic: 'Lists',
  },
  {
    id: 20,
    question: 'In Python, list counting starts from...',
    options: ['1', '0', '10', 'It depends'],
    correct: 1,
    topic: 'Lists',
  },
  {
    id: 21,
    question: 'What does input() do in Python?',
    options: ['Prints something on screen', 'Waits for the user to type something', 'Does math', 'Creates a variable'],
    correct: 1,
    topic: 'Basics',
  },
  {
    id: 22,
    question: 'What will this print?\n\nword = \"HELLO\"\nprint(word.lower())',
    options: ['HELLO', 'hello', 'Hello', 'Error'],
    correct: 1,
    topic: 'Strings',
  },
  {
    id: 23,
    question: 'You want to repeat something WHILE a condition is true. Which loop do you use?',
    options: ['for loop', 'while loop', 'repeat loop', 'do loop'],
    correct: 1,
    topic: 'Loops',
  },
  {
    id: 24,
    question: 'What does this print?\n\nprint(10 > 5)',
    options: ['10', '5', 'True', 'Yes'],
    correct: 2,
    topic: 'Logic',
  },
  {
    id: 25,
    question: 'What does \"break\" do inside a loop?',
    options: ['Crashes the program', 'Stops the loop and moves on', 'Pauses for 1 second', 'Starts the loop over'],
    correct: 1,
    topic: 'Loops',
  },
  {
    id: 26,
    question: 'What will this print?\n\nnums = [10, 20, 30]\nprint(nums[-1])',
    options: ['10', '20', '30', 'Error'],
    correct: 2,
    topic: 'Lists',
  },
  {
    id: 27,
    question: 'How do you make Python print a number AND text together?\n\nage = 11',
    options: ['print(\"I am \" + age)', 'print(\"I am\", age)', 'print(I am age)', 'print(\"I am\" age)'],
    correct: 1,
    topic: 'Basics',
  },
  {
    id: 28,
    question: 'What does this function give back?\n\ndef add(a, b):\n    return a + b\n\nresult = add(3, 7)',
    options: ['3', '7', '10', 'Nothing'],
    correct: 2,
    topic: 'Functions',
  },
  {
    id: 29,
    question: 'Which one is NOT a data type in Python?',
    options: ['String (text)', 'Integer (whole number)', 'Character', 'Boolean (True/False)'],
    correct: 2,
    topic: 'Data Types',
  },
  {
    id: 30,
    question: 'You built a robot and want to make it move 5 times. Which code is best?',
    options: [
      'move()  move()  move()  move()  move()',
      'for i in range(5):\n    move()',
      'move() * 5',
      'repeat 5 move()',
    ],
    correct: 1,
    topic: 'Loops',
  },
]

/**
 * Select N random questions from the pool
 */
export function selectQuestions(count = 20) {
  const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
