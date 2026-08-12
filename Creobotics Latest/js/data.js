// data.js
// Location: js/data.js
//
// Static content for Creobotics: 32 detailed lessons from the Grade 4 robotics book.
// Kept separate from app.js so content can be edited/extended without
// touching any application logic.

// Avatar options shown on the one-time "set up your profile" screen after
// signup/login (and reachable later from the Profile page). These are
// simple placeholder robot icons — swap in your own 8 pictures by replacing
// the files in images/avatars/ (keep the same filenames) or by pointing
// `src` at different files below.
const AVATARS = [
  { id: "boy-1", gender: "boy", label: "Blue", src: "images/avatars/boy1.svg" },
  { id: "boy-2", gender: "boy", label: "Teal", src: "images/avatars/boy2.svg" },
  { id: "boy-3", gender: "boy", label: "Orange", src: "images/avatars/boy3.svg" },
  { id: "boy-4", gender: "boy", label: "Indigo", src: "images/avatars/boy4.svg" },
  { id: "girl-1", gender: "girl", label: "Pink", src: "images/avatars/girl1.svg" },
  { id: "girl-2", gender: "girl", label: "Violet", src: "images/avatars/girl2.svg" },
  { id: "girl-3", gender: "girl", label: "Magenta", src: "images/avatars/girl3.svg" },
  { id: "girl-4", gender: "girl", label: "Mint", src: "images/avatars/girl4.svg" },
];

// Grade groupings Creobotics supports: Grade 4, Grade 5, Grade 6, Junior
// High (Grades 7-10), and Senior High (Grades 11-12). Grade 4 ships with
// 32 built-in lessons below. The other groups start empty — content for
// them gets added directly to creo_custom_modules tagged with the
// appropriate numeric `grade` (5, 6, 7-10, or 11-12).
const GRADES = [
  { id: "grade-4", label: "Grade 4", levels: [4], seniorHigh: false },
  { id: "grade-5", label: "Grade 5", levels: [5], seniorHigh: false },
  { id: "grade-6", label: "Grade 6", levels: [6], seniorHigh: false },
  { id: "junior-high", label: "Junior High", levels: [7, 8, 9, 10], seniorHigh: false },
  { id: "senior-high", label: "Senior High", levels: [11, 12], seniorHigh: true },
];

// Grade 4 ships with 32 built-in lessons based on the Creobotics Grade 4 book.
const BUILTIN_GRADE = 4;

// Helper to create consistent lesson content blocks
function lessonContent(title, paragraphs, lists = [], subheadings = []) {
  const blocks = [];
  blocks.push({ type: "h", text: title });
  if (paragraphs) {
    paragraphs.forEach(p => blocks.push({ type: "p", text: p }));
  }
  if (subheadings) {
    subheadings.forEach(sh => {
      blocks.push({ type: "h", text: sh.title });
      if (sh.paragraphs) sh.paragraphs.forEach(p => blocks.push({ type: "p", text: p }));
      if (sh.items) blocks.push({ type: "ul", items: sh.items });
    });
  }
  if (lists) blocks.push({ type: "ul", items: lists });
  return blocks;
}

function quizQuestion(q, options, correct, explanation) {
  return { q, options, correct, explanation };
}

// Module colors
const COLORS = {
  c1: "#2f6fed",
  c2: "#f0a64d",
  c3: "#21b6a8",
  c4: "#8b5cf6",
  c5: "#4caf7d",
  c6: "#e2483a",
  c7: "#2f6fed",
  c8: "#f0a64d",
  c9: "#21b6a8",
  c10: "#8b5cf6",
  c11: "#4caf7d",
  c12: "#e2483a",
  c13: "#2f6fed",
  c14: "#f0a64d",
  c15: "#21b6a8",
  c16: "#8b5cf6",
  c17: "#4caf7d",
  c18: "#e2483a",
  c19: "#2f6fed",
  c20: "#f0a64d",
  c21: "#21b6a8",
  c22: "#8b5cf6",
  c23: "#4caf7d",
  c24: "#e2483a",
  c25: "#2f6fed",
  c26: "#f0a64d",
  c27: "#21b6a8",
  c28: "#8b5cf6",
  c29: "#4caf7d",
  c30: "#e2483a",
  c31: "#2f6fed",
  c32: "#f0a64d",
};

const MODULES = [
  // Lesson 1: Elements of a Robot
  {
    id: 1,
    grade: 4,
    title: "Elements of a Robot",
    subtitle: "Sense, Compute, and Act!",
    color: COLORS.c1,
    content: [
      { type: "h", text: "What Makes Something a Robot?" },
      { type: "p", text: "A robot is a very special kind of machine. It can carry out complex actions automatically (all by itself!). Robots are smart because they are powered by electricity and run by a program (a set of instructions written by a human!)." },
      { type: "h", text: "The Robot Power Trio!" },
      { type: "p", text: "To do its job, a robot always performs these three important steps:" },
      { type: "ul", items: ["Sense: Detect objects and check the conditions around it.", "Compute: Think about the information using its program brain.", "Act: Move around or carry out physical actions!"] },
      { type: "h", text: "The 3 Main Elements of a Robot" },
      { type: "p", text: "Every robot is made of specific parts that work together to bring it to life:" },
      { type: "ul", items: ["1. SENSORS: Input devices that let the robot sense the world — measure things like light, sound, motion, temperature, and smell.", "2. HARDWARE: Physical parts like metal pieces, motors, tracks, and wheels. Hardware creates the robot's form and physical capabilities.", "3. SOFTWARE: Coded instructions or algorithms that tell the robot what to do. Software processes sensor info and communicates between the robot and the roboticist (you!)."] },
    ],
    quiz: [
      // Activity 1: The "Sense, Compute, Act" Challenge
      quizQuestion(
        "Based on what we learned, can a machine do all three tasks (Sense, Compute, Act)? Which robot below can do all three?",
        ["A simple wall clock that moves its gears forward to spin the hands at the exact same speed all day, but cannot sense anything.", "An mBot Ranger that drives safely across the floor, senses obstacles using sensors, processes instructions, and automatically turns around."],
        1,
        "The mBot Ranger senses obstacles, computes what to do, and acts by turning around — the wall clock only acts, it can't sense anything."
      ),
      // Activity 2: True or False (4 questions)
      quizQuestion(
        "Sensors work like human sensory organs (hands, eyes, ears) to feed values to the robot.",
        ["TRUE", "FALSE"],
        0,
        "Sensors are the robot's input devices, just like our eyes, ears, and hands let us sense the world."
      ),
      quizQuestion(
        "Software is the collection of physical metal parts and wheels that build a robot's body.",
        ["TRUE", "FALSE"],
        1,
        "That description belongs to Hardware — Software is the set of coded instructions or algorithms that tell the robot what to do."
      ),
      quizQuestion(
        "Without software algorithms, a robot will never be able to accomplish much.",
        ["TRUE", "FALSE"],
        0,
        "Software is the set of coded instructions that tells the robot what to do — without it, sensors and hardware have no directions to follow."
      ),
      quizQuestion(
        "Sensors are also considered a type of hardware element because you can touch them.",
        ["TRUE", "FALSE"],
        1,
        "The lesson treats Sensors, Hardware, and Software as three separate main elements of a robot, not sensors as a subtype of hardware."
      ),
      // Activity 3: Match the Robot Part!
      quizQuestion(
        "Your eyes, ears, and skin touch pads match which robot element?",
        ["Software (Coded directions/rules)", "Sensors (Input units)", "Hardware (Physical structures)"],
        1,
        "Eyes, ears, and skin are sensory organs — they match Sensors, which are input units for the robot."
      ),
      quizQuestion(
        "Your muscles, arms, legs, and skeleton match which robot element?",
        ["Software (Coded directions/rules)", "Sensors (Input units)", "Hardware (Physical structures)"],
        2,
        "Muscles, arms, legs, and skeleton give the body its physical form and movement — the robot counterpart is Hardware."
      ),
      quizQuestion(
        "Your thoughts, logic, and learned rules match which robot element?",
        ["Software (Coded directions/rules)", "Sensors (Input units)", "Hardware (Physical structures)"],
        0,
        "Thoughts, logic, and rules are like Software — coded instructions that tell the robot what to do."
      ),
    ]
  },
  // Lesson 2: Robot's Hardware
  {
    id: 2,
    grade: 4,
    title: "Robot's Hardware",
    subtitle: "Physical components and their classifications",
    color: COLORS.c2,
    content: [
      { type: "h", text: "What is Hardware?" },
      { type: "p", text: "Hardware refers to the physical components or tangible parts of a robot. Tangible means it is something real that you can touch and see with your own eyes! Hardware allows a robot to perform its actions, like sensing obstacles and driving around. Some hardware parts need electrical power to run, while others do not!" },
      { type: "h", text: "Why is Hardware Important?" },
      { type: "ul", items: ["Protection: It forms a tough outer frame to protect delicate internal electronic brains.", "Capabilities: It gives the robot its physical abilities to do actual jobs!"] },
      { type: "h", text: "The 4 Classifications of Hardware" },
      { type: "p", text: "Robot hardware items are sorted into four operational groups depending on what job they do:" },
      { type: "ul", items: ["1. INPUT DEVICES: Sensors that gather data from surroundings (like an ultrasonic distance sensor!).", "2. OUTPUT DEVICES: Generates physical actions or signs (like motors spinning wheels, flashing LEDs, or buzzer sounds!).", "3. PROCESS HARDWARE: Coordinates all separate parts (the central motherboard that handles command traffic).", "4. STORAGE PARTS: Internal digital memory where coding instructions and data logs are saved safely."] },
      { type: "h", text: "Mechanical vs. Electronic Hardware" },
      { type: "ul", items: ["1. Mechanical Parts: Physical shape, body, or skeleton — wheels, metal beams, screws, motors.", "2. Electronic Parts: Circuit boards, microcontrollers, sensors — the internal nerve networks."] },
    ],
    quiz: [
      // Activity 1: Multiple Choice Challenge (3 questions)
      quizQuestion(
        "Hardware parts that you can see and touch are called:",
        ["Imaginary parts", "Tangible parts", "Software programs", "Virtual parts"],
        1,
        "Hardware means the physical parts of the robot — frame, motors, sensors, wiring, and so on. 'Tangible' means something you can touch."
      ),
      quizQuestion(
        "Which classification of hardware is responsible for storing programs?",
        ["Input", "Output", "Storage", "Process"],
        2,
        "Storage parts hold programs and data in memory. Input devices sense, output devices act, and process hardware coordinates everything."
      ),
      quizQuestion(
        "A metal structural bar or a wheel belongs to which kind of hardware?",
        ["Mechanical part", "Electronic part", "Programming code", "Software"],
        0,
        "Mechanical parts form the physical structure — bars, wheels, beams, and motors are mechanical hardware, not electronic."
      ),
      // Activity 2: Hardware Sorting (6 items into 2 columns)
      quizQuestion(
        "From the sorting list, Rubber Tracks and Metal Screws belong to which column?",
        ["Mechanical Parts", "Electronic Parts"],
        0,
        "Rubber tracks and metal screws are physical structural pieces — mechanical parts."
      ),
      quizQuestion(
        "From the sorting list, a Distance Sensor and a Microcontroller Chip belong to which column?",
        ["Mechanical Parts", "Electronic Parts"],
        1,
        "Sensors and microcontroller chips are circuit-based components that act as the robot's nerve network — electronic parts."
      ),
      quizQuestion(
        "From the sorting list, an Electric Motor belongs to which column?",
        ["Mechanical Parts", "Electronic Parts"],
        0,
        "The lesson groups wheels, metal beams, screws, and motors together as mechanical parts that allow movement."
      ),
      // Activity 3: Label the Robot Parts (4 items)
      quizQuestion(
        "The Ultrasonic Distance Sensor is classified as:",
        ["Mechanical", "Electronic"],
        1,
        "The ultrasonic sensor is an electronic component that uses sound waves to measure distance."
      ),
      quizQuestion(
        "The Continuous Rubber Tank Tracks are classified as:",
        ["Mechanical", "Electronic"],
        0,
        "Rubber tank tracks are physical structural parts — they are mechanical hardware."
      ),
      quizQuestion(
        "The Main Processor Controller Board is classified as:",
        ["Mechanical", "Electronic"],
        1,
        "The main controller board is an electronic circuit board that processes commands."
      ),
      quizQuestion(
        "The Lithium Battery Holder Frame is classified as:",
        ["Mechanical", "Electronic"],
        0,
        "The battery holder frame is a physical structural part — mechanical hardware."
      ),
    ]
  },
  // Lesson 3: Assembling a Robot
  {
    id: 3,
    grade: 4,
    title: "Assembling a Robot",
    subtitle: "Connecting hardware to build a form",
    color: COLORS.c3,
    content: [
      { type: "h", text: "Connecting Hardware to Build a Form" },
      { type: "p", text: "Assembling a robot is where our structural planning becomes a physical machine! By following detailed, step-by-step 3D building guides in the Makeblock App, we combine separate mechanical and electronic hardware parts to complete the robot's structure." },
      { type: "h", text: "The Builder's Golden Rules" },
      { type: "ul", items: ["Match Your Screws: Pay close attention to different sizes like short M4x8mm screws vs longer M4x25mm screws!", "Route Cables Safely: Connect electronic units carefully using RJ25 and Encoder Motor cables without pinching them.", "Secure the Tracks: Always verify that continuous tracks fit tightly around your wheels so your robot doesn't lose traction!"] },
      { type: "h", text: "Testing Your Finished Robot" },
      { type: "p", text: "Once construction wraps up, you must run hardware diagnostic checks to determine if all wire connections and parts are fastened correctly. We do this by launching the Play Mode within the application!" },
      { type: "ul", items: ["STEP 1: Open Play Mode App interface", "STEP 2: Launch Drive Control dashboard"] },
      { type: "h", text: "Know Your Dashboard Controls!" },
      { type: "ul", items: ["Joystick: Move this on your screen to maneuver your robot around classroom obstacles smoothly.", "Action Modes: Switch between specialized driving styles: Sprint (high speed), Spin (tight turns), and Swerve (zig-zag movement).", "Indicators: Tap the Lights button and the Buzzer button to verify that your outputs respond instantly!"] },
    ],
    quiz: [
      // Activity 1: Assembly Timeline Sequence (4 steps)
      quizQuestion(
        "In the assembly timeline, which phase happens FIRST?",
        ["Attach the Me Auriga main controller brain board using short M4 screws and plug in the RJ25 communication cables.", "Put down the structural base plate frames, 180 Encoder Motors, and lock them together tightly.", "Slip on the continuous rubber tank tracks over the wheel frames to finish the vehicle form.", "Mount the battery holder box onto its frame support plates and install your 6 AA batteries."],
        1,
        "The base plate frames and encoder motors form the robot's structural foundation, so they're locked together first."
      ),
      quizQuestion(
        "In the assembly timeline, which phase happens SECOND?",
        ["Attach the Me Auriga main controller brain board using short M4 screws and plug in the RJ25 communication cables.", "Put down the structural base plate frames, 180 Encoder Motors, and lock them together tightly.", "Slip on the continuous rubber tank tracks over the wheel frames to finish the vehicle form.", "Mount the battery holder box onto its frame support plates and install your 6 AA batteries."],
        0,
        "After the base structure is built, the main controller board is attached next."
      ),
      quizQuestion(
        "In the assembly timeline, which phase happens THIRD?",
        ["Attach the Me Auriga main controller brain board using short M4 screws and plug in the RJ25 communication cables.", "Put down the structural base plate frames, 180 Encoder Motors, and lock them together tightly.", "Slip on the continuous rubber tank tracks over the wheel frames to finish the vehicle form.", "Mount the battery holder box onto its frame support plates and install your 6 AA batteries."],
        3,
        "The battery holder is mounted after the controller board and before the final track assembly."
      ),
      quizQuestion(
        "In the assembly timeline, which phase happens FOURTH (last)?",
        ["Attach the Me Auriga main controller brain board using short M4 screws and plug in the RJ25 communication cables.", "Put down the structural base plate frames, 180 Encoder Motors, and lock them together tightly.", "Slip on the continuous rubber tank tracks over the wheel frames to finish the vehicle form.", "Mount the battery holder box onto its frame support plates and install your 6 AA batteries."],
        2,
        "The rubber tank tracks are slipped on last to complete the vehicle form."
      ),
      // Activity 2: Control Button Matching (3 items)
      quizQuestion(
        "The Joystick Wheel on the Drive dashboard controls:",
        ["Triggers the sound board to emit a loud buzz alarm tone.", "Activates colorful LED light modules on top of the main circuit board.", "Directs electrical power to left/right motors to steer around obstacles."],
        2,
        "The joystick directs electrical power to the left/right motors so you can steer the robot around obstacles."
      ),
      quizQuestion(
        "The Buzzer Icon Button on the Drive dashboard:",
        ["Triggers the sound board to emit a loud buzz alarm tone.", "Activates colorful LED light modules on top of the main circuit board.", "Directs electrical power to left/right motors to steer around obstacles."],
        0,
        "The Buzzer button verifies the sound output responds instantly by triggering an alarm tone."
      ),
      quizQuestion(
        "The Lights Icon Button on the Drive dashboard:",
        ["Triggers the sound board to emit a loud buzz alarm tone.", "Activates colorful LED light modules on top of the main circuit board.", "Directs electrical power to left/right motors to steer around obstacles."],
        1,
        "The Lights button verifies the LED output responds instantly by activating the colorful ring lights."
      ),
      // Activity 3: Engineering Diagnosis Studio (2 questions)
      quizQuestion(
        "You push the joystick forward, but your robot spins in circles instead of driving straight. What is the FIRST hardware check you should inspect?",
        ["The color of the LED lights", "The wheel and motor cable connections on the left and right sides", "The brand of the batteries", "The color of the screws"],
        1,
        "If one side's motor or cable isn't connected correctly, the wheels turn unevenly and the robot spins instead of driving straight — so the left/right motor and cable connections are the first thing to check."
      ),
      quizQuestion(
        "You push the joystick forward, but your robot spins in circles instead of driving straight. What is the SECOND hardware check you should inspect?",
        ["The color of the LED lights", "Whether the rubber tracks are tightly fitted around the wheels", "The brand of the batteries", "The color of the screws"],
        1,
        "If the tracks aren't fitted tightly, one side may slip and cause the robot to spin instead of drive straight."
      ),
    ]
  },
  // Lesson 4: Makeblock Application
  {
    id: 4,
    grade: 4,
    title: "Makeblock Application",
    subtitle: "Communication and Control",
    color: COLORS.c4,
    content: [
      { type: "h", text: "What is the Makeblock Application?" },
      { type: "p", text: "The Makeblock Application provides a comprehensive robot control experience. It helps us with everything from building step instructions to utilizing pre-set controls, and even lets us program custom robot movements! Using the app helps us develop important visual-spatial skills and offers playful layout designs to control our creations." },
      { type: "h", text: "Understanding Robotic Communication" },
      { type: "p", text: "To control our robot from a tablet or phone, the two devices must talk to each other! Communication is the transmission of a message from a sender to a receiver in an understandable manner." },
      { type: "h", text: "The 4 Elements of Communication" },
      { type: "ul", items: ["1. Sender: The entity that creates and sends out the message (like you using the app!).", "2. Receiver: The entity that catches the message (like your robot body!).", "3. Message: The actual data or directive being passed along (like 'Drive Forward!').", "4. Medium: The channel or pathway linking the sender and receiver to transfer data."] },
      { type: "h", text: "Wired vs. Wireless Medium" },
      { type: "ul", items: ["Wired Medium: Data travels over a physical path — cables or wires link devices together.", "Wireless Medium: No physical wires involved! Uses radio waves traveling at the speed of light."] },
      { type: "h", text: "Focus Word: Bluetooth" },
      { type: "p", text: "Bluetooth is a short-range wireless communication technology. It links your devices together within its immediate range, acting just like an invisible string or cord to create a secure personal area network! It lets devices share raw data, voices, music, and control signals." },
    ],
    quiz: [
      // Activity 1: Vocabulary Match (4 terms)
      quizQuestion(
        "Communication is best defined as:",
        ["A short-range wireless path that acts like an invisible cable between devices.", "The process of setting up an initial linkage between computing devices.", "Sending a message from a sender to a receiver so it is easily understood.", "The channel or path that transfers information between a sender and receiver."],
        2,
        "Communication is the transmission of a message from a sender to a receiver in an understandable manner."
      ),
      quizQuestion(
        "Medium in communication refers to:",
        ["A short-range wireless path that acts like an invisible cable between devices.", "The process of setting up an initial linkage between computing devices.", "Sending a message from a sender to a receiver so it is easily understood.", "The channel or path that transfers information between a sender and receiver."],
        3,
        "The medium is the channel or pathway that links the sender and receiver to transfer data."
      ),
      quizQuestion(
        "Bluetooth is best described as:",
        ["A short-range wireless path that acts like an invisible cable between devices.", "The process of setting up an initial linkage between computing devices.", "Sending a message from a sender to a receiver so it is easily understood.", "The channel or path that transfers information between a sender and receiver."],
        0,
        "Bluetooth links devices together within its immediate range, acting just like an invisible string or cord."
      ),
      quizQuestion(
        "Pairing in Bluetooth refers to:",
        ["A short-range wireless path that acts like an invisible cable between devices.", "The process of setting up an initial linkage between computing devices.", "Sending a message from a sender to a receiver so it is easily understood.", "The channel or path that transfers information between a sender and receiver."],
        1,
        "Pairing is the process of setting up an initial linkage between devices so they can communicate."
      ),
      // Activity 2: Wired vs Wireless (4 items)
      quizQuestion(
        "An RJ25 cord connecting a sensor to the Me Auriga circuit board is:",
        ["Wired", "Wireless"],
        0,
        "A physical cable carrying the data makes this a wired connection."
      ),
      quizQuestion(
        "A tablet application sending steering commands to an mBot Ranger across the room is:",
        ["Wired", "Wireless"],
        1,
        "No physical cable links the tablet and robot — commands travel over radio waves, making this wireless."
      ),
      quizQuestion(
        "A phone streaming music to a speaker using Bluetooth signals is:",
        ["Wired", "Wireless"],
        1,
        "Bluetooth uses radio waves with no physical cable, so this is a wireless connection."
      ),
      quizQuestion(
        "A USB cable connecting a computer to a robot board to load code is:",
        ["Wired", "Wireless"],
        0,
        "A USB cable is a physical connection — this is a wired communication medium."
      ),
      // Activity 3: The Communication Diagram (4 fill-in-the-blank style questions)
      quizQuestion(
        "When you press a button on your tablet screen to make the mBot Ranger flash its lights, your tablet acts as the:",
        ["Sender", "Message", "Medium", "Receiver"],
        0,
        "The tablet creates and sends out the command — it is the Sender."
      ),
      quizQuestion(
        "The command instruction telling the lights to turn on is the:",
        ["Sender", "Message", "Medium", "Receiver"],
        1,
        "The actual data or directive being passed along is the Message."
      ),
      quizQuestion(
        "The invisible Bluetooth radio waves carrying the instruction act as the communication:",
        ["Sender", "Message", "Medium", "Receiver"],
        2,
        "The medium is the channel or pathway — like Bluetooth radio waves — that links the sender and receiver."
      ),
      quizQuestion(
        "The robot catching the instruction and flashing its lights acts as the:",
        ["Sender", "Message", "Medium", "Receiver"],
        3,
        "The robot receives and acts on the instruction — it is the Receiver."
      ),
    ]
  },
  // Lesson 5: Line Follow
  {
    id: 5,
    grade: 4,
    title: "Line Follow",
    subtitle: "Building an autonomous machine",
    color: COLORS.c5,
    content: [
      { type: "h", text: "What is a Line Tracker Robot?" },
      { type: "p", text: "A line tracker robot is an autonomous machine designed to automatically follow a path marked by a line (usually black) on the floor. Even if the path is twisted, curved, or completely altered, the robot has the special task of sticking to the line to travel from one place to another!" },
      { type: "h", text: "How Does the Line Follower Sensor Work?" },
      { type: "p", text: "To follow a track, the robot utilizes a specialized hardware element called a Line Follower Sensor Module. This module contains two main infrared (IR) sensor units right next to each other (Sensor 1 and Sensor 2)." },
      { type: "h", text: "The Secret of Infrared Light" },
      { type: "p", text: "Each sensor contains an IR Transmitter (which shoots out invisible infrared light downward) and an IR Receiver (which catches the reflected light bouncing back up)." },
      { type: "ul", items: ["White or Light Surfaces: Reflect a lot of light! This generates a High Value of Reflectance (Value = 1).", "Black Lines: Dark black surfaces absorb the light, so very little bounces back. This generates a Low Value of Reflectance (Value = 0)."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "A line tracker robot can follow a black line even if the path's shape is altered.",
        ["TRUE", "FALSE"],
        0,
        "Even if the path is twisted, curved, or completely altered, the robot's task is to stick to the line."
      ),
      quizQuestion(
        "Dark black tracks give a value of 1 because they reflect a high amount of light.",
        ["TRUE", "FALSE"],
        1,
        "Black surfaces absorb light and produce a Low Value of Reflectance (Value = 0), not 1."
      ),
      quizQuestion(
        "Line follower sensors give a value of 1 when they see white or light-colored floors.",
        ["TRUE", "FALSE"],
        0,
        "White surfaces reflect a lot of light, generating a High Value of Reflectance (Value = 1)."
      ),
      quizQuestion(
        "Automated line follower robots are helpful carrier tools inside industrial factories.",
        ["TRUE", "FALSE"],
        0,
        "Factories use line followers as automated equipment carriers to move heavy parts without human drivers."
      ),
      // Activity 2: Decode the Sensor Logic! (4 logic puzzles)
      quizQuestion(
        "In the sensor logic puzzle, if Sensor 1 reads Black (0) and Sensor 2 reads White (1), what does the robot see?",
        ["Both sensors are on the black line — robot drives straight.", "Sensor 2 drifted onto the white floor — robot adjusts its path.", "Sensor 1 drifted onto the white floor — robot adjusts its path.", "Both sensors hit the white floor — the robot is lost off-track."],
        0,
        "Sensor 2 sees white while Sensor 1 sees black — Sensor 2 has drifted off the line, so the robot adjusts its path."
      ),
      quizQuestion(
        "In the sensor logic puzzle, if Sensor 1 reads White (1) and Sensor 2 reads Black (0), what does the robot see?",
        ["Both sensors are on the black line — robot drives straight.", "Sensor 2 drifted onto the white floor — robot adjusts its path.", "Sensor 1 drifted onto the white floor — robot adjusts its path.", "Both sensors hit the white floor — the robot is lost off-track."],
        1,
        "Sensor 1 sees white while Sensor 2 still sees black — Sensor 1 has drifted off the line, so the robot adjusts its path."
      ),
      quizQuestion(
        "In the sensor logic puzzle, if Sensor 1 reads Black (0) and Sensor 2 reads Black (0), what does the robot see?",
        ["Both sensors are on the black line — robot drives straight.", "Sensor 2 drifted onto the white floor — robot adjusts its path.", "Sensor 1 drifted onto the white floor — robot adjusts its path.", "Both sensors hit the white floor — the robot is lost off-track."],
        0,
        "Both sensors on the black line means the robot drives straight forward."
      ),
      quizQuestion(
        "In the sensor logic puzzle, if both Sensor 1 and Sensor 2 read White (1, 1), what does the robot see?",
        ["Both sensors are on the black line — robot drives straight.", "Sensor 2 drifted onto the white floor — robot adjusts its path.", "Sensor 1 drifted onto the white floor — robot adjusts its path.", "Both sensors hit the white floor — the robot is lost off-track."],
        3,
        "When both sensors see white, the robot has completely left the line and is lost off-track."
      ),
    ]
  },
  // Lesson 6: Draw and Run
  {
    id: 6,
    grade: 4,
    title: "Draw and Run",
    subtitle: "Touchscreen path programming",
    color: COLORS.c6,
    content: [
      { type: "h", text: "Physical Skills for Robotics" },
      { type: "p", text: "Physical Skills necessary to execute body actions accurately and develop good motor control loops." },
      { type: "h", text: "Touchscreen Technology" },
      { type: "p", text: "The Draw and Run system relies entirely on touchscreens! A touchscreen is an electronic visual display capable of 'detecting' and 'locating' a touch over its screen canvas area. It is highly sensitive to a human finger, hand, fingernail, or a tool like a stylus pen." },
      { type: "h", text: "How Do Touchscreens Work?" },
      { type: "ul", items: ["1. A normal glass panel is layered with special conductive and resistive metallic sheets.", "2. When your finger presses the screen, the two hidden metallic sheets touch right at that point.", "3. A sudden change in electrical current registers as a touch event and travels instantly to the microcontroller board for processing!"] },
      { type: "h", text: "Advantages of Touch Interface Controls" },
      { type: "ul", items: ["Reality-Based Interaction: Controls feel natural because you directly manipulate screen elements.", "Space & Mobility: Removes the need for heavy physical keyboards or bulky tracking mice.", "Speed & Time Saving: Tapping commands directly saves immense navigation time.", "Simple Interfaces: Systems are highly accessible and incredibly easy to clean or wipe down!"] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "A touchscreen requires an external keyboard to locate exactly where a user clicked.",
        ["TRUE", "FALSE"],
        1,
        "Touchscreens detect touch directly on the screen surface — no external keyboard needed."
      ),
      quizQuestion(
        "When a finger presses a screen, metallic conductive and resistive layers make contact.",
        ["TRUE", "FALSE"],
        0,
        "The two metallic sheets touch at the point of pressure, registering a touch event."
      ),
      quizQuestion(
        "Changes in electrical currents are what register touch events for controllers to process.",
        ["TRUE", "FALSE"],
        0,
        "The change in electrical current at the touch point is what the controller detects."
      ),
      quizQuestion(
        "Solving complex puzzles decreases mental speed and lowers total dopamine levels.",
        ["TRUE", "FALSE"],
        1,
        "Solving puzzles actually improves mental speed and can increase dopamine."
      ),
      // Activity 2: Skill Group Sorting (3 items)
      quizQuestion(
        "Managing emotions and creating rewarding relationships with your classmates is a:",
        ["Physical Skill", "Cognitive Skill", "Emotional Skill"],
        2,
        "Emotional skills involve managing feelings and building relationships."
      ),
      quizQuestion(
        "Using fine motor precision movements to trace paths on a mobile drawing pad is a:",
        ["Physical Skill", "Cognitive Skill", "Emotional Skill"],
        0,
        "Physical skills involve motor control and precise movements."
      ),
      quizQuestion(
        "Executing deep learning processes and critical mental math problem-solving is a:",
        ["Physical Skill", "Cognitive Skill", "Emotional Skill"],
        1,
        "Cognitive skills involve thinking, learning, and problem-solving."
      ),
    ]
  },
  // Lesson 7: Coding Tutorials 1
  {
    id: 7,
    grade: 4,
    title: "Coding Tutorials 1",
    subtitle: "Introduction to block-based coding",
    color: COLORS.c7,
    content: [
      { type: "h", text: "What is Coding?" },
      { type: "p", text: "Coding is a system of symbols and rules that serve as instructions for a computer. It is the primary method that allows humans and machines to talk to each other (intercommunication)." },
      { type: "h", text: "Rules for Giving Clear Instructions" },
      { type: "p", text: "Just like when playing a game of Simon Says, instructions given to a computer or robot must be followed exactly! Good instructions should always be:" },
      { type: "ul", items: ["Direct and Clear: Use specific commands so there are no confusing steps.", "One at a Time: Give instructions in sequential order, keeping them simple and logical."] },
      { type: "h", text: "Block-Based Coding" },
      { type: "p", text: "Instead of writing text, we use Block-Based Coding! Instructions are represented visually as interlocking puzzle blocks. We select commands from a palette and drag them together, so memorizing commands is not needed." },
      { type: "h", text: "The Makeblock Code Categories" },
      { type: "p", text: "Makeblock separates your instruction commands into seven color-coded categories:" },
      { type: "ul", items: ["Hardware-Interacting Blocks: Move, Show, and Sense — give direct commands to the physical robot hardware.", "Structure & Logic Blocks: Data, Blocks, Math, and Control — provide extra flexibility for solving complex problems."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "Coding is the primary method for allowing intercommunication between humans and machines.",
        ["TRUE", "FALSE"],
        0,
        "Coding is indeed the primary language that allows humans to give instructions to computers."
      ),
      quizQuestion(
        "Block-based coding requires you to memorize code text lines before starting.",
        ["TRUE", "FALSE"],
        1,
        "Block-based coding uses visual blocks instead of text, so no memorization of syntax is needed."
      ),
      quizQuestion(
        "The Move, Show, and Sense categories are used to instruct the physical hardware components.",
        ["TRUE", "FALSE"],
        0,
        "These categories control physical hardware like motors, lights, and sensors."
      ),
      quizQuestion(
        "Giving instructions all at once makes commands logical and simple for a machine to parse.",
        ["TRUE", "FALSE"],
        1,
        "Instructions should be given one at a time in sequential order for clarity."
      ),
      // Activity 2: Category Matching (3 items)
      quizQuestion(
        "The Move Category is used for:",
        ["Building math calculations or conditional loop logic structures.", "Instructing the robot motors to steer or drive forward at a selected speed.", "Directing electronic hardware components like LED panels to produce lights."],
        1,
        "The Move category controls motors and movement."
      ),
      quizQuestion(
        "The Show Category is used for:",
        ["Building math calculations or conditional loop logic structures.", "Instructing the robot motors to steer or drive forward at a selected speed.", "Directing electronic hardware components like LED panels to produce lights."],
        2,
        "The Show category controls output hardware like LED panels and buzzers."
      ),
      quizQuestion(
        "The Math & Control Categories are used for:",
        ["Building math calculations or conditional loop logic structures.", "Instructing the robot motors to steer or drive forward at a selected speed.", "Directing electronic hardware components like LED panels to produce lights."],
        0,
        "Math and Control categories handle calculations and logic flow."
      ),
    ]
  },
  // Lesson 8: Coding Tutorials 2
  {
    id: 8,
    grade: 4,
    title: "Coding Tutorials 2",
    subtitle: "Advanced logic blocks",
    color: COLORS.c8,
    content: [
      { type: "h", text: "Creativity in Robotics" },
      { type: "p", text: "Creativity is the ability of a person to produce original and unusual ideas. It generates helpful alternatives or possibilities that are incredibly useful in robotic problem-solving!" },
      { type: "h", text: "Why Being Creative Matters" },
      { type: "ul", items: ["Reduces Stress: Working on creative tasks reduces anxiety and puts you in a happy zone.", "Solves Problems: Helps you view challenges differently and deal with uncertainties.", "Builds Confidence: You discover that failure is simply a helpful part of the process to grow and improve your work!"] },
      { type: "h", text: "Advanced Makeblock Logic Blocks" },
      { type: "p", text: "To create smart, adaptive programs, we use four essential categories of flexible coding blocks:" },
      { type: "ul", items: ["1. DATA BLOCKS: Used to create user-defined variables to store and alter custom information dynamically.", "2. BLOCKS CATEGORY: Used to create your own custom instructions, customized functions, or new block groupings.", "3. MATH BLOCKS: Provides programming blocks for mathematical calculations and number comparison solutions.", "4. CONTROL BLOCKS: Handles automated logical pathways involving conditional rules (IF-THEN) and repetitive loops (FOREVER)."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "Creativity allows you to express yourself and gives you a wonderful sense of purpose.",
        ["TRUE", "FALSE"],
        0,
        "Creativity indeed provides self-expression and purpose."
      ),
      quizQuestion(
        "Control blocks are used whenever your code needs mathematical solutions involving computations.",
        ["TRUE", "FALSE"],
        1,
        "Control blocks handle logic flow — Math blocks handle calculations."
      ),
      quizQuestion(
        "Data blocks let roboticists create variables to change values inside a block program.",
        ["TRUE", "FALSE"],
        0,
        "Data blocks allow creation and manipulation of variables."
      ),
      quizQuestion(
        "Discovering that failure is a part of the design process helps build your confidence levels.",
        ["TRUE", "FALSE"],
        0,
        "Learning from failure builds resilience and confidence."
      ),
      // Activity 2: Category Matching (3 items)
      quizQuestion(
        "The Data Category is used for:",
        ["Creating a 'Forever' block loop so an action repeats over and over.", "Setting up a custom variable to hold or keep track of a shifting number value.", "Evaluating whether a measurement is greater than or less than a target value."],
        1,
        "Data blocks create and manage variables."
      ),
      quizQuestion(
        "The Math Category is used for:",
        ["Creating a 'Forever' block loop so an action repeats over and over.", "Setting up a custom variable to hold or keep track of a shifting number value.", "Evaluating whether a measurement is greater than or less than a target value."],
        2,
        "Math blocks evaluate and compare values."
      ),
      quizQuestion(
        "The Control Category is used for:",
        ["Creating a 'Forever' block loop so an action repeats over and over.", "Setting up a custom variable to hold or keep track of a shifting number value.", "Evaluating whether a measurement is greater than or less than a target value."],
        0,
        "Control blocks handle loops and logic flow."
      ),
    ]
  },
  // Lesson 9: Movements and Motor Control
  {
    id: 9,
    grade: 4,
    title: "Movements and Motor Control",
    subtitle: "DC and servo motors",
    color: COLORS.c9,
    content: [
      { type: "h", text: "Why Movement Matters" },
      { type: "p", text: "Movement is one of the most visible and important functions of a robot. How a robot moves determines what tasks it can perform and how efficiently it can complete them." },
      { type: "h", text: "Three Common Types of Motors" },
      { type: "ul", items: ["DC Motor: Spins continuously clockwise or counterclockwise using battery power.", "Servo Motor: Perfect for sweeping arcs limited to specific angles like 90° or 180°.", "Stepper Motor: Moves step-by-step in highly rigid, fixed angles."] },
      { type: "h", text: "Movement Code Blocks" },
      { type: "p", text: "The Move category contains blocks like:" },
      { type: "ul", items: ["[ drive forward 1 second at speed 150 ] — Tells the robot to drive in a given direction, for a specific length of time, at a specific speed.", "[ keep moving forward at speed 150 ] — Instructs the robot to drive forward continuously until another block tells it to stop.", "[ left wheel speed to 150 ] and [ right wheel speed to 50 ] — Creates circular or curving motion by setting different wheel speeds."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "Motors convert physical movement back into raw electrical battery energy.",
        ["TRUE", "FALSE"],
        1,
        "Motors convert electrical energy into physical movement, not the other way around."
      ),
      quizQuestion(
        "Servo motors are used to produce continuous clockwise and counterclockwise spinning loops.",
        ["TRUE", "FALSE"],
        1,
        "Servo motors move to specific angles — DC motors produce continuous spinning."
      ),
      quizQuestion(
        "Setting different speeds for the left and right wheels makes the robot move in a circle.",
        ["TRUE", "FALSE"],
        0,
        "Different wheel speeds cause the robot to turn or curve."
      ),
      quizQuestion(
        "Movement choices directly impact the power sustainability of a robot's battery supply.",
        ["TRUE", "FALSE"],
        0,
        "Different movements consume different amounts of power."
      ),
      // Activity 2: Motor Matching (3 items)
      quizQuestion(
        "This motor spins continuously clockwise or counterclockwise using batteries:",
        ["Servo Motor", "Stepper Motor", "DC Motor"],
        2,
        "DC motors provide continuous rotation."
      ),
      quizQuestion(
        "This motor moves step-by-step in highly rigid, fixed angles:",
        ["Servo Motor", "Stepper Motor", "DC Motor"],
        1,
        "Stepper motors move in precise steps."
      ),
      quizQuestion(
        "This motor is perfect for sweeping arcs limited to arcs like 90° or 180°:",
        ["Servo Motor", "Stepper Motor", "DC Motor"],
        0,
        "Servo motors move to specific angles within a limited range."
      ),
    ]
  },
  // Lesson 10: Buzzer and Play Note
  {
    id: 10,
    grade: 4,
    title: "Buzzer and Play Note",
    subtitle: "Audio output programming",
    color: COLORS.c10,
    content: [
      { type: "h", text: "What is a Buzzer?" },
      { type: "p", text: "A buzzer is a basic physical output hardware device found on the mBot Ranger that produces beep tones to create various sounds. It requires a direct current (DC) voltage to operate and is typically used as an alert or alarm device!" },
      { type: "h", text: "The Importance of Robot Sound" },
      { type: "ul", items: ["Communication: Transmits messages, status updates, or hazard warnings.", "Mental Effect: Can soothe minds and help relieve stress or fatigue.", "Focus Guidance: Works alongside visual parts to help determine what we observe."] },
      { type: "h", text: "Three Types of Buzzers" },
      { type: "ul", items: ["1. Piezoelectric: Generates a very loud, high-pitched, and sharp beep noise.", "2. Mechanical: Uses physical striking parts; typically used as a household doorbell.", "3. Electromechanical: Very convenient to use in project structures because of simple connection wires."] },
      { type: "h", text: "The Play Note Code Block" },
      { type: "p", text: "To command our robot to produce sounds, we use the Play Note Code Block found in the bright blue Show Block category. This block activates the built-in buzzer to play musical tones." },
      { type: "ul", items: ["Musical Note Selector: Choose from eight musical notes (C5, D5, E5, F5, G5, A5, B5, and C6).", "Beat Selector: Controls the time duration (eighth, quarter, half, whole, or double beats)."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "The buzzer is considered an input device because it listens to musical notes.",
        ["TRUE", "FALSE"],
        1,
        "A buzzer is an output device — it produces sound, it doesn't listen."
      ),
      quizQuestion(
        "The Play Note block belongs inside the Move block programming category.",
        ["TRUE", "FALSE"],
        1,
        "The Play Note block is in the Show category, not Move."
      ),
      quizQuestion(
        "There are exactly eight default musical notes available inside the mBlock interface.",
        ["TRUE", "FALSE"],
        0,
        "The notes C5 through C6 are available (C5, D5, E5, F5, G5, A5, B5, C6)."
      ),
      quizQuestion(
        "Mechanical buzzers are the most common choice for building household doorbells.",
        ["TRUE", "FALSE"],
        0,
        "Mechanical buzzers with striking parts are used in many doorbells."
      ),
      // Activity 2: Audio Programming Matching (3 items)
      quizQuestion(
        "C5, E5, or G5 are:",
        ["The time duration length options, such as half, whole, or quarter notes.", "The specific pitch choices found inside the musical note selector menu.", "The color-coded menu cluster where audio sound blocks are stored."],
        1,
        "These are musical notes from the note selector menu."
      ),
      quizQuestion(
        "Eighth, Quarter, Half are:",
        ["The time duration length options, such as half, whole, or quarter notes.", "The specific pitch choices found inside the musical note selector menu.", "The color-coded menu cluster where audio sound blocks are stored."],
        0,
        "These are time duration options for how long a note plays."
      ),
      quizQuestion(
        "The Show Category is:",
        ["The time duration length options, such as half, whole, or quarter notes.", "The specific pitch choices found inside the musical note selector menu.", "The color-coded menu cluster where audio sound blocks are stored."],
        2,
        "The Play Note block is stored in the blue Show category."
      ),
    ]
  },
  // Lesson 11: RGB LED Ring Display
  {
    id: 11,
    grade: 4,
    title: "RGB LED Ring Display",
    subtitle: "Colorful output programming",
    color: COLORS.c11,
    content: [
      { type: "h", text: "What is an LED?" },
      { type: "p", text: "LED stands for Light Emitting Diode. It is a special kind of glowing electronic component that glows beautifully when electricity passes through it! Robots use LEDs as an output device to display light as a clear means of communication." },
      { type: "h", text: "Ranger's RGB LED Ring Display" },
      { type: "p", text: "The mBot Ranger contains exactly 12 individual multi-colored LEDs arranged in a circular ring formation right on top of the Me Auriga main controller board. Each LED is given a specific coordinate number from 1 to 12 so we can control them one by one!" },
      { type: "h", text: "The Ranger Color Palette" },
      { type: "p", text: "Because they are RGB (Red, Green, Blue) LEDs, they can blend light together to produce up to 9 preset palette choices: Red, Orange, Yellow, Green, Cyan, Blue, Purple, White, and Black (turns the light off!)." },
      { type: "h", text: "Coding Your Lights" },
      { type: "ul", items: ["[ LED panel all lights, color is red ] — Turns on a specified LED (or all) using a ready-to-use color.", "[ LED panel all lights, color is red 255 green 0 blue 0 ] — Advanced custom blending with values from 0 to 255.", "[ wait 1 secs ] — Found in Control category. Acts as a delay command that pauses before running the next step."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "LED stands for Light Emitting Device.",
        ["TRUE", "FALSE"],
        1,
        "LED stands for Light Emitting Diode."
      ),
      quizQuestion(
        "The mBot Ranger has exactly 12 individual LEDs arranged in a circle on top of its brain board.",
        ["TRUE", "FALSE"],
        0,
        "The ring has 12 LEDs numbered 1 to 12."
      ),
      quizQuestion(
        "The 'Wait' block is included inside the blue Show Block programming category.",
        ["TRUE", "FALSE"],
        1,
        "The Wait block is in the orange Control category."
      ),
      quizQuestion(
        "Selecting the color 'Black' inside the color palette is how we instruct an LED to turn off.",
        ["TRUE", "FALSE"],
        0,
        "Black turns the LED off completely."
      ),
      // Activity 2: Color Palette Blending Puzzles (3 items)
      quizQuestion(
        "RGB values Red=255, Green=0, Blue=0 produce:",
        ["Pure Red", "Pure Green", "Pure Blue"],
        0,
        "255 Red with no Green or Blue produces pure Red."
      ),
      quizQuestion(
        "RGB values Red=0, Green=255, Blue=0 produce:",
        ["Pure Red", "Pure Green", "Pure Blue"],
        1,
        "255 Green with no Red or Blue produces pure Green."
      ),
      quizQuestion(
        "RGB values Red=0, Green=0, Blue=255 produce:",
        ["Pure Red", "Pure Green", "Pure Blue"],
        2,
        "255 Blue with no Red or Green produces pure Blue."
      ),
    ]
  },
  // Lesson 12: Math Blocks
  {
    id: 12,
    grade: 4,
    title: "Math Blocks",
    subtitle: "Calculations in coding",
    color: COLORS.c12,
    content: [
      { type: "h", text: "Mathematics and Robotics" },
      { type: "p", text: "Mathematics is the science of numbers and their operations. It is the study of numbers, shapes, and patterns to help us solve real-world problems. In coding, math blocks help our robots compute calculations to make smart choices!" },
      { type: "h", text: "Working with Math Blocks" },
      { type: "p", text: "The coding blocks for calculations live inside the red Math Block category. To use them successfully, keep these rules in mind:" },
      { type: "ul", items: ["Two Values Needed: They always require two numerical values to perform an operation.", "Must Be Snapped: They cannot work by themselves! They must be snapped inside other blocks to execute."] },
      { type: "h", text: "Order of Operations: MDAS" },
      { type: "p", text: "When solving complex math equations in code, we must apply the MDAS rule:" },
      { type: "ul", items: ["1. First, process all Multiplication and Division operations moving from left to right.", "2. Next, process all Addition and Subtraction operations moving from left to right."] },
    ],
    quiz: [
      // Activity 1: Fill in the Blanks (4 questions)
      quizQuestion(
        "The multiplication block is used to find the _______ of two numbers.",
        ["sum", "difference", "product", "quotient"],
        2,
        "Multiplication finds the product."
      ),
      quizQuestion(
        "The addition block is used to find the _______ of two numbers.",
        ["sum", "difference", "product", "quotient"],
        0,
        "Addition finds the sum."
      ),
      quizQuestion(
        "The division block is used to find the _______ of two numbers.",
        ["sum", "difference", "product", "quotient"],
        3,
        "Division finds the quotient."
      ),
      quizQuestion(
        "The subtraction block is used to find the _______ of two numbers.",
        ["sum", "difference", "product", "quotient"],
        1,
        "Subtraction finds the difference."
      ),
      // Activity 2: Apply the Rules of MDAS! (2 puzzles)
      quizQuestion(
        "Solve: 5 × 8 − 12 ÷ 6 + 16 =",
        ["54", "55", "56", "57"],
        0,
        "40 - 2 + 16 = 54. (5×8=40, 12÷6=2, then 40-2+16=54)"
      ),
      quizQuestion(
        "Solve: 72 × 25 ÷ 180 =",
        ["10", "11", "12", "13"],
        0,
        "72×25=1800, then 1800÷180=10."
      ),
    ]
  },
  // Lesson 13: Sense Blocks
  {
    id: 13,
    grade: 4,
    title: "Sense Blocks",
    subtitle: "Sensor input programming",
    color: COLORS.c13,
    content: [
      { type: "h", text: "What are Sensors?" },
      { type: "p", text: "Sensors are physical components that detect and respond to different inputs from the surrounding environment. They function as the input devices of a robot. Just like human sensory organs help us explore, sensors send a data signal to the processor board so the robot knows how to react or respond!" },
      { type: "h", text: "Understanding Sense Blocks" },
      { type: "p", text: "The code strings that trigger these components live in the light blue Sense Block category. These commands activate our sensors. They must be snapped into other blocks like conditional if-then commands or calculation math blocks to do their work!" },
      { type: "ul", items: ["[ obstacle ahead ] — Checks if there is an object blocking the path. Returns True or False.", "[ distance to obstacle ] — Measures the actual distance gap between itself and an object. Returns a numerical value.", "[ strength of light ] — Detects how strong or bright the surrounding light conditions are. Returns a numerical value.", "[ sound detected / sound sensor ] — Listens for or measures sound intensity levels. Returns a numerical value."] },
      { type: "h", text: "Combining Sense Blocks with Control Blocks" },
      { type: "ul", items: ["If-Then Block: A conditional command that tests an expression answerable by True or False.", "Forever Block: A looping command that instructs the robot to repeat actions over and over without stopping."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "Sensors serve as output devices that show the actions of a robot.",
        ["TRUE", "FALSE"],
        1,
        "Sensors are input devices — they gather data, not show actions."
      ),
      quizQuestion(
        "The 'if-then' command block requires a Boolean expression to execute.",
        ["TRUE", "FALSE"],
        0,
        "If-then needs a True/False condition to decide."
      ),
      quizQuestion(
        "The 'obstacle ahead' block gives a numerical value like a distance calculation.",
        ["TRUE", "FALSE"],
        1,
        "Obstacle ahead gives True/False — distance to obstacle gives a number."
      ),
      quizQuestion(
        "The 'forever' block is a looping command used to repeat actions.",
        ["TRUE", "FALSE"],
        0,
        "Forever creates an infinite loop of repeated actions."
      ),
      // Activity 2: Sensor Return Values (4 items)
      quizQuestion(
        "The 'obstacle ahead' block returns:",
        ["True or False (Boolean)", "A numerical value", "A color", "A sound"],
        0,
        "It returns Boolean True/False."
      ),
      quizQuestion(
        "The 'distance to obstacle' block returns:",
        ["True or False (Boolean)", "A numerical value", "A color", "A sound"],
        1,
        "It returns a numerical distance measurement."
      ),
      quizQuestion(
        "The 'strength of light' block returns:",
        ["True or False (Boolean)", "A numerical value", "A color", "A sound"],
        1,
        "It returns a numerical value representing brightness."
      ),
      quizQuestion(
        "The 'sound detected' block returns:",
        ["True or False (Boolean)", "A numerical value", "A color", "A sound"],
        0,
        "Sound detected returns True/False — sound sensor volume returns a number."
      ),
    ]
  },
  // Lesson 14: Ultrasonic Sensor
  {
    id: 14,
    grade: 4,
    title: "Ultrasonic Sensor",
    subtitle: "Distance measurement",
    color: COLORS.c14,
    content: [
      { type: "h", text: "What is an Ultrasonic Sensor?" },
      { type: "p", text: "An ultrasonic sensor is an electronic module that measures distance. It looks like it has two 'eyes'! One of these eyes is a transmitter, and the other is a receiver. This sensor is used to detect obstacles so our robot doesn't bump into things!" },
      { type: "h", text: "How Does It Work?" },
      { type: "ul", items: ["1. The Transmitter: Launches an ultrasonic sound wave forward and immediately starts a digital timer.", "2. The Receiver: The sound wave bounces off an obstacle and travels back. The receiver catches the reflected wave and stops the timer instantly!"] },
      { type: "h", text: "Branching Logic: The If-Then-Else Block" },
      { type: "p", text: "To use sensor data to make choices, we use the orange If-Then-Else Code Block from the Control category. This block is 'dependent' because it requires other blocks to be snapped inside it to execute." },
      { type: "ul", items: ["IF Slot: Snaps a Boolean/conditional expression block (like obstacle ahead).", "THEN Slot: Executes if the condition is True.", "ELSE Slot: Executes if the condition is False."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "An ultrasonic sensor measures the temperature of the air around a robot.",
        ["TRUE", "FALSE"],
        1,
        "Ultrasonic sensors measure distance, not temperature."
      ),
      quizQuestion(
        "The transmitter launches an ultrasonic sound wave and starts time-keeping.",
        ["TRUE", "FALSE"],
        0,
        "The transmitter sends the wave and starts timing."
      ),
      quizQuestion(
        "The if-then-else block belongs inside the blue Show Block programming category.",
        ["TRUE", "FALSE"],
        1,
        "If-then-else is in the orange Control category."
      ),
      quizQuestion(
        "Ultrasonic sensors are used in car parking barrier systems to control entry.",
        ["TRUE", "FALSE"],
        0,
        "They detect vehicles to control barriers."
      ),
      // Activity 2: Real-World Application Matching (3 items)
      quizQuestion(
        "Car Parking System uses ultrasonic sensors to:",
        ["Control entry gates or barriers based on vehicle presence.", "Measure or control liquid level heights inside large water or oil tanks.", "Activate smart automated doors or systems when a person stands nearby."],
        0,
        "Ultrasonic sensors detect vehicles to control parking barriers."
      ),
      quizQuestion(
        "Industrial Storage Tanks use ultrasonic sensors to:",
        ["Control entry gates or barriers based on vehicle presence.", "Measure or control liquid level heights inside large water or oil tanks.", "Activate smart automated doors or systems when a person stands nearby."],
        1,
        "Ultrasonic sensors measure liquid levels in storage tanks."
      ),
      quizQuestion(
        "Presence Detection uses ultrasonic sensors to:",
        ["Control entry gates or barriers based on vehicle presence.", "Measure or control liquid level heights inside large water or oil tanks.", "Activate smart automated doors or systems when a person stands nearby."],
        2,
        "Ultrasonic sensors detect people to activate automated doors."
      ),
    ]
  },
  // Lesson 15: Light Sensor
  {
    id: 15,
    grade: 4,
    title: "Light Sensor",
    subtitle: "Brightness detection",
    color: COLORS.c15,
    content: [
      { type: "h", text: "What is a Light Sensor?" },
      { type: "p", text: "A light sensor is an input hardware device that measures and responds to different levels of surrounding light. The physical value it calculates is known as illuminance." },
      { type: "h", text: "How It Works on the mBot Ranger" },
      { type: "p", text: "The mBot Ranger actually has two built-in light sensors right on top of its main circuit board! A specialized small window component called a photocell allows each sensor to detect incoming rays." },
      { type: "ul", items: ["If no external light rays hit the photocell window, the sensor value drops to a low level, representing darkness.", "If a flashlight or bright sunbeam hits the photocell window, the reading instantly spikes to a high level, representing a bright environment."] },
      { type: "h", text: "Conditional Delays: The Wait-Until Block" },
      { type: "p", text: "To write program routines that respond to environmental brightness transitions, we utilize a specialized tracking block called the orange Wait-Until Code Block from the Control category." },
      { type: "ul", items: ["Serves as a conditional delay code block.", "Completely suspends or pauses the execution of all succeeding instructions until a specified conditional expression is completely satisfied!"] },
      { type: "h", text: "Real-World Illuminance Systems" },
      { type: "ul", items: ["Smart Street Lighting: Automated lamp posts check brightness to switch streetlights.", "Solar Energy Tracking: Directs motorized solar panel grids to track optimal sunshine angles.", "Mobile Device Backlights: Measures room lighting to adjust screen brightness."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "The physical value of brightness measured by a light sensor is called illuminance.",
        ["TRUE", "FALSE"],
        0,
        "Illuminance is the scientific term for brightness measurement."
      ),
      quizQuestion(
        "The mBot Ranger has exactly one light sensor mounted on its chassis wheels.",
        ["TRUE", "FALSE"],
        1,
        "It has two sensors on the main circuit board, not on wheels."
      ),
      quizQuestion(
        "The 'Wait-Until' command block pauses code execution until a condition expression is satisfied.",
        ["TRUE", "FALSE"],
        0,
        "Wait-Until pauses until the condition becomes True."
      ),
      quizQuestion(
        "Smart city streetlights use light sensors to automatically turn on when sunset arrives.",
        ["TRUE", "FALSE"],
        0,
        "Light sensors detect darkness and trigger the lights."
      ),
      // Activity 2: Wait-Until Logic (3 items)
      quizQuestion(
        "What active driving movement does the robot execute immediately when the code is executed?",
        ["Moves forward", "Moves backward", "Stops moving", "Turns left"],
        0,
        "The robot moves forward when the program starts."
      ),
      quizQuestion(
        "What happens to the robot when it encounters a physical object blockage ahead?",
        ["It stops moving", "It moves backward", "It turns around", "It waits until the obstacle is gone"],
        3,
        "The wait-until block pauses the robot until the obstacle is no longer detected."
      ),
      quizQuestion(
        "What happens to the robot the instant it encounters a physical object blockage ahead?",
        ["It stops moving", "It moves backward", "It waits until the obstacle is gone", "It turns around"],
        2,
        "The wait-until block pauses execution until the condition is satisfied — the robot waits."
      ),
    ]
  },
  // Lesson 16: Sound Sensor
  {
    id: 16,
    grade: 4,
    title: "Sound Sensor",
    subtitle: "Audio input programming",
    color: COLORS.c16,
    content: [
      { type: "h", text: "What is a Sound Sensor?" },
      { type: "p", text: "A sound sensor is an input hardware device that works similarly to our human ears! It consists of a small board combining a microphone and processing circuitry. It detects the ambient sound intensity in the robot's surroundings." },
      { type: "p", text: "The sensor uses its microphone to convert sound vibrations into an electrical signal. These components usually have a built-in amplifier to increase the strength of the incoming signal." },
      { type: "h", text: "Coding with Sound: The Sense Blocks" },
      { type: "p", text: "To access sound data, we look in the light blue Sense Blocks category. Both blocks are 'dependent blocks' because they need to be snapped inside other commands to function:" },
      { type: "ul", items: ["[ sound detected ] — Activates the sensor to detect whenever any noise occurs.", "[ sound sensor volume ] — Activates the sensor to measure the precise volume level."] },
      { type: "h", text: "Pros and Cons of Sound Sensors" },
      { type: "ul", items: ["Advantages: Useful for security alarms, fast speech-to-text, voice control safety.", "Disadvantages: Sound files consume memory, voice recognition is less accurate than typing, wireless microphones have limited range."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "A sound sensor converts raw electrical signals directly into physical sound vibrations.",
        ["TRUE", "FALSE"],
        1,
        "It converts sound vibrations into electrical signals."
      ),
      quizQuestion(
        "The 'sound detected' code block belongs inside the light blue Sense Blocks category.",
        ["TRUE", "FALSE"],
        0,
        "Sound blocks are in the Sense category."
      ),
      quizQuestion(
        "Voice recognition software is generally more accurate than typing things out manually.",
        ["TRUE", "FALSE"],
        1,
        "Typing is generally more accurate than voice recognition."
      ),
      quizQuestion(
        "Built-in amplifiers are used to increase the strength of incoming sound signals.",
        ["TRUE", "FALSE"],
        0,
        "Amplifiers boost the electrical signal from the microphone."
      ),
      // Activity 2: Sound Loop Description
      quizQuestion(
        "What does the forever-until loop do in the sound sensor program?",
        ["Plays musical notes continuously until stopped manually", "Plays musical notes repeatedly until a loud sound is detected", "Plays musical notes exactly 10 times then stops", "Plays musical notes only when the robot is moving"],
        1,
        "The loop plays musical notes repeatedly until the sound sensor detects a loud sound, then exits the loop."
      ),
      quizQuestion(
        "When does the forever-until loop stop playing notes?",
        ["When the robot runs out of battery", "When the sound intensity becomes greater than the threshold", "When the robot completes 10 loops", "When the robot stops moving"],
        1,
        "The loop terminates when the sound sensor detects a volume greater than the set threshold."
      ),
      // Activity 3: Sound Sensor Application
      quizQuestion(
        "If your robot is programmed to flash its LED display only when the sound intensity is greater than 400, what happens when you give a quiet whisper?",
        ["LED flashes", "LED stays off", "LED turns red", "LED blinks slowly"],
        1,
        "A quiet whisper produces a low volume value below 400, so the condition is False and the LED stays off."
      ),
      quizQuestion(
        "If your robot is programmed to flash its LED display only when the sound intensity is greater than 400, what happens when you give a loud clap?",
        ["LED flashes", "LED stays off", "LED turns red", "LED blinks slowly"],
        0,
        "A loud clap produces a high volume value above 400, so the condition is True and the LED flashes."
      ),
    ]
  },
  // Lesson 17: Control Blocks
  {
    id: 17,
    grade: 4,
    title: "Control Blocks",
    subtitle: "Program flow management",
    color: COLORS.c17,
    content: [
      { type: "h", text: "What is Control and Control Flow?" },
      { type: "p", text: "Control means to direct a course of events and manage the flow of actions or steps in a process. It regulates operations, checks for errors, and triggers corrective actions." },
      { type: "p", text: "In programming, control flow is the exact order of execution of blocks. It dictates the sequence of commands that the robot's brain will follow." },
      { type: "h", text: "The 3 Main Types of Control Blocks" },
      { type: "p", text: "The orange Control Block category includes three essential families that alter the execution flow:" },
      { type: "ul", items: ["1. Selection Blocks: Allows one set of statements to execute if a condition is True, and alternative actions if False (e.g., if-then-else).", "2. Looping Blocks: Allows code blocks to be executed repeatedly (e.g., forever, forever until, count-based loops).", "3. Delay Blocks: Suspends or pauses execution for a designated time window or until a condition matches (e.g., wait 1 secs, wait until)."] },
      { type: "h", text: "Special Escape Block: break out of loop" },
      { type: "p", text: "This command lets the robot exit or break out of a repeating loop instantly when a specific trigger condition is met!" },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "Control flow is the specific order or sequence in which coding blocks are executed.",
        ["TRUE", "FALSE"],
        0,
        "Control flow determines the execution sequence."
      ),
      quizQuestion(
        "Delay blocks are used to repeatedly execute a series of actions over and over.",
        ["TRUE", "FALSE"],
        1,
        "Looping blocks repeat actions — Delay blocks pause execution."
      ),
      quizQuestion(
        "Selection blocks change the flow of a program into two potential alternative branches.",
        ["TRUE", "FALSE"],
        0,
        "Selection blocks create branching paths."
      ),
      quizQuestion(
        "The 'break out of loop' command forces a robot to stay inside a loop forever.",
        ["TRUE", "FALSE"],
        1,
        "Break exits the loop immediately."
      ),
      // Activity 2: Control Group Matching (3 items)
      quizQuestion(
        "The if-then-else block belongs to the:",
        ["Selection Block Group", "Looping Block Group", "Delay Block Group"],
        0,
        "If-then-else creates selection branches."
      ),
      quizQuestion(
        "The wait 1 secs block belongs to the:",
        ["Selection Block Group", "Looping Block Group", "Delay Block Group"],
        2,
        "Wait blocks pause execution — they are delay blocks."
      ),
      quizQuestion(
        "The forever until block belongs to the:",
        ["Selection Block Group", "Looping Block Group", "Delay Block Group"],
        1,
        "Forever until is a looping block."
      ),
    ]
  },
  // Lesson 18: Data Blocks
  {
    id: 18,
    grade: 4,
    title: "Data Blocks",
    subtitle: "Variables and data storage",
    color: COLORS.c18,
    content: [
      { type: "h", text: "What is Data and a Variable?" },
      { type: "p", text: "Data is distinct pieces of facts or raw information. Data can exist in a variety of forms called variables." },
      { type: "p", text: "A variable is a value that can change. It is considered a storage unit or container that keeps the actual data safely inside it." },
      { type: "h", text: "The Two Key Components of a Variable" },
      { type: "ul", items: ["1. Name: Identifies the variable. Each name should be completely unique.", "2. Data Type: Indicates what specific type of data is to be stored (Integer, Float, Character, String)."] },
      { type: "h", text: "Programming Your Data: Makeblock Data Blocks" },
      { type: "p", text: "The dark purple Data block category allows programmers the freedom to create custom blocks by defining variables:" },
      { type: "ul", items: ["Make a variable Button: The place where the name of your new variable is typed and entered.", "Set and Change blocks: Used to assign values and update them."] },
    ],
    quiz: [
      // Activity 1: Vocabulary Check (4 questions)
      quizQuestion(
        "Distinct pieces of facts or raw information are called:",
        ["Loops", "Data", "Blocks", "Motors"],
        1,
        "Data is distinct pieces of facts or raw information, which can exist in a variety of forms called variables."
      ),
      quizQuestion(
        "A ______ is a container or storage space that holds data and can change its value.",
        ["Sensor", "Variable", "Buzzer", "Category"],
        1,
        "A variable is a value that can change — it's a storage unit or container that keeps the actual data safely inside it."
      ),
      quizQuestion(
        "Whole numbers are stored using which data type?",
        ["Float", "String", "Integer", "Character"],
        2,
        "The Integer data type stores whole numbers, while Float stores real decimal numbers."
      ),
      quizQuestion(
        "Setting a variable to 0 at the start of a program defines its ______ value.",
        ["final", "initial", "random", "maximum"],
        1,
        "The 'set variable to 0' block sets the initial value — the starting number — of the variable."
      ),
      // Activity 2: Code Analysis (3 questions)
      quizQuestion(
        "What is the name of the custom variable used in the example script (set Route to 0, then check if Route = 1 or Route = 2 inside a loop)?",
        ["Data", "Task", "Route", "Counter"],
        2,
        "The script names its variable Route and uses it to decide whether the robot moves forward or backward."
      ),
      quizQuestion(
        "In that same script, what is the initial starting value assigned to that variable?",
        ["0", "1", "2", "5"],
        0,
        "The script sets Route to 0 at the start."
      ),
      quizQuestion(
        "In that same script, how much does the Route variable increase by at the end of each loop repetition?",
        ["0", "1", "2", "5"],
        1,
        "The script ends each loop with 'change Route by 1', increasing the variable by 1 each time."
      ),
    ]
  },
  // Lesson 19: User-defined Blocks
  {
    id: 19,
    grade: 4,
    title: "User-defined Blocks",
    subtitle: "Custom functions",
    color: COLORS.c19,
    content: [
      { type: "h", text: "What is a User-defined Block?" },
      { type: "p", text: "User-defined blocks are custom blocks created by a programmer to perform a specific action or task. They act as programming shortcuts that let us compress long lines of code, making our program clean, reusable, and easy to manage!" },
      { type: "h", text: "Key Benefits of Custom Blocks" },
      { type: "ul", items: ["Code Decomposition: Breaks a massive program into tiny, manageable segments.", "Better Readability: Makes programs cleaner and much easier to scan or read.", "Reduces Duplication: Saves you from dragging the exact same group of blocks over and over!"] },
      { type: "h", text: "The Pink Palette: Define and Call" },
      { type: "p", text: "To create your own block, you go to the bright pink Blocks category palette in the application:" },
      { type: "ul", items: ["The Definition Block: Name your block uniquely after the task it will do (like a shortcut header).", "The Custom Action Block: Once defined, a brand new action block with your custom name appears, ready to be used anywhere in the main program!"] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "User-defined blocks require you to memorize complex text strings to compile.",
        ["TRUE", "FALSE"],
        1,
        "User-defined blocks are visual shortcuts — no text memorization needed."
      ),
      quizQuestion(
        "Creating custom blocks splits big programs into smaller, organized sections.",
        ["TRUE", "FALSE"],
        0,
        "Decomposition breaks large programs into manageable parts."
      ),
      quizQuestion(
        "Custom functions help reduce duplicate code blocks inside our main script workspace.",
        ["TRUE", "FALSE"],
        0,
        "Custom blocks eliminate repetition."
      ),
      quizQuestion(
        "Custom block definitions are created inside the bright blue Move block category.",
        ["TRUE", "FALSE"],
        1,
        "They are in the pink Blocks category, not Move."
      ),
      // Activity 2: Code Analysis (3 questions)
      quizQuestion(
        "What is the explicit name of the custom user-defined block built in the example?",
        ["Move Forward", "Turn Around", "Dance", "Loop"],
        2,
        "The custom block is named Dance in the example."
      ),
      quizQuestion(
        "What specific task do the internal blocks nested inside the definition execute?",
        ["Move the robot in a specific pattern", "Play a musical note", "Turn on the LEDs", "Read a sensor"],
        0,
        "The Dance block contains movement instructions."
      ),
      quizQuestion(
        "Under what exact condition does the main program pull or call the custom block into action?",
        ["When the program starts", "When the robot detects an obstacle", "When a button is pressed", "When the variable reaches a certain value"],
        3,
        "The custom block is called when the variable condition is met (e.g., if Task = 1)."
      ),
    ]
  },
  // Lesson 20: If-then Block
  {
    id: 20,
    grade: 4,
    title: "If-then Block",
    subtitle: "Conditional decisions",
    color: COLORS.c20,
    content: [
      { type: "h", text: "What is a Selection Structure?" },
      { type: "p", text: "A selection structure (also known as a decision structure) is a method where a program asks a question. Depending on the answer, the program takes one of two courses of action, after which the program moves on to the next operational steps!" },
      { type: "h", text: "The Rules of the If-Then Block" },
      { type: "p", text: "The orange Control block category contains the foundational if-then block. It features two crucial sections:" },
      { type: "ul", items: ["The Condition Slot: Snaps a conditional statement that uses a relational operator to generate a binary Boolean value (True or False).", "The Action Clause: Holds multiple inner instructions that execute ONLY if the condition's result is completely TRUE! If it is False, the robot skips those steps entirely."] },
    ],
    quiz: [
      // Activity 1: Multiple Choice (3 questions)
      quizQuestion(
        "A selection structure is also widely known as a:",
        ["Looping structure", "Decision structure", "Hardware structure", "Data structure"],
        1,
        "Selection structures make decisions based on conditions."
      ),
      quizQuestion(
        "Conditional statements use relational operators to generate what kind of value?",
        ["Boolean value", "Text name value", "Time beat value", "Color value"],
        0,
        "Relational operators return True or False."
      ),
      quizQuestion(
        "The blocks inside the 'then' slot will execute only if the condition result is:",
        ["False", "True", "Zero", "Maybe"],
        1,
        "Then executes only when the condition is True."
      ),
      // Activity 2: Code Analysis (3 questions)
      quizQuestion(
        "What does the robot continuously do as long as the condition remains False in the if-then example?",
        ["Move forward", "Move backward", "Stop moving", "Turn left"],
        0,
        "The robot moves forward until the condition becomes True."
      ),
      quizQuestion(
        "What specific numerical measurement target triggers the condition slot in the example?",
        ["Distance to obstacle < 100", "Distance to obstacle > 100", "Distance to obstacle = 100", "Distance to obstacle < 50"],
        0,
        "The condition is 'distance to obstacle < 100'."
      ),
      quizQuestion(
        "List three physical actions the output devices perform once the result becomes True:",
        ["Stop, display red lights, play ambulance sound", "Move forward, display green lights, play music", "Move backward, display blue lights, play beep", "Turn left, display yellow lights, play siren"],
        0,
        "The actions are: stop moving, display red lights, and produce an ambulance sound loop."
      ),
    ]
  },
  // Lesson 21: If-then-else Block
  {
    id: 21,
    grade: 4,
    title: "If-then-else Block",
    subtitle: "Two-way decisions",
    color: COLORS.c21,
    content: [
      { type: "h", text: "What is a Conditional Statement?" },
      { type: "p", text: "A conditional statement gives a program the ability to make decisions! It checks whether a statement is True or False, and alters the direction of code execution based on that result. This lets our robot choose between different options or alternatives." },
      { type: "h", text: "The Rules of the If-Then-Else Block" },
      { type: "p", text: "The orange Control category includes the if-then-else block. It gives our program two alternative paths:" },
      { type: "ul", items: ["The Condition Slot: Evaluates an expression using a relational operator to generate a Boolean answer (True or False).", "The THEN Branch: Code inside this block executes ONLY if the condition is TRUE.", "The ELSE Branch: Code inside this block executes ONLY if the condition is FALSE."] },
    ],
    quiz: [
      // Activity 1: Multiple Choice (3 questions)
      quizQuestion(
        "A control flow structure that splits a program's path between two separate actions is called:",
        ["A variable box", "An if-then-else statement", "A user block shortcut", "A sensor block"],
        1,
        "If-then-else creates two alternative execution paths."
      ),
      quizQuestion(
        "If the test condition inside an if-then-else block turns out to be FALSE, the robot will execute:",
        ["The code inside the then branch", "The code inside the else branch", "No code lines at all", "The code twice"],
        1,
        "Else branch runs when the condition is False."
      ),
      quizQuestion(
        "Picking or selecting from multiple available options or alternatives is known as:",
        ["Branching choice", "Continuous looping", "Value initialization", "Data storage"],
        0,
        "Branching allows choosing between options."
      ),
      // Activity 2: Code Analysis (2 questions)
      quizQuestion(
        "In the if-then-else example, what two actions does the robot execute as long as the path is completely clear (False condition)?",
        ["Move forward and play music", "Move forward with green lights ON", "Move backward with red lights ON", "Turn left with yellow lights ON"],
        1,
        "The robot continues moving forward with green lights ON when the path is clear."
      ),
      quizQuestion(
        "In the if-then-else example, what driving action takes place immediately if an obstacle is detected (True condition)?",
        ["Move forward", "Move backward for 5 seconds", "Stop moving", "Turn left"],
        1,
        "The robot moves backward for 5 seconds when an obstacle is detected."
      ),
    ]
  },
  // Lesson 22: Forever-Until Block
  {
    id: 22,
    grade: 4,
    title: "Forever-Until Block",
    subtitle: "Conditional loops",
    color: COLORS.c22,
    content: [
      { type: "h", text: "What is a Loop?" },
      { type: "p", text: "A loop is a control flow statement used to specify iteration. It allows a single line of code or a series of multiple code blocks to be executed repeatedly!" },
      { type: "p", text: "Loops are incredibly powerful because they automate tasks so you don't have to keep writing the same commands over and over. However, a proper loop must always have a logical condition that allows it to stop and exit!" },
      { type: "h", text: "The Rules of the Forever-Until Block" },
      { type: "p", text: "The orange Control category includes the forever-until block. It works like this:" },
      { type: "ul", items: ["While Condition is FALSE: The robot keeps repeating all the instructions placed inside the loop body over and over.", "When Condition is TRUE: The loop instantly terminates! The robot exits the loop body and moves on to any blocks snapped below it."] },
    ],
    quiz: [
      // Activity 1: Multiple Choice (3 questions)
      quizQuestion(
        "A control flow structure that allows blocks of code to execute repeatedly is called a:",
        ["Selection block", "Loop", "Variable storage box", "Data block"],
        1,
        "Loops enable repeated execution."
      ),
      quizQuestion(
        "When using a forever-until loop, the execution of the loop body stops as soon as the condition turns out to be:",
        ["False", "True", "Zero", "Negative"],
        1,
        "Loop stops when condition becomes True."
      ),
      quizQuestion(
        "To quit or terminate a repeating loop body instantly is known as:",
        ["Iteration", "Exiting the loop", "Initializing values", "Debugging"],
        1,
        "Exiting terminates the loop."
      ),
      // Activity 2: Code Analysis (3 questions)
      quizQuestion(
        "In the forever-until example, what two actions does the robot execute repeatedly as long as the path stays completely clear?",
        ["Move forward and play music", "Move forward with green lights", "Move backward with red lights", "Turn left with yellow lights"],
        1,
        "The robot moves forward with green lights ON while the path is clear."
      ),
      quizQuestion(
        "What exact event terminates the forever-until loop in the example?",
        ["Robot detects an obstacle", "Robot runs out of battery", "Robot completes 10 loops", "Robot stops moving"],
        0,
        "The loop terminates when an obstacle is detected (condition becomes True)."
      ),
      quizQuestion(
        "What two actions take place immediately after the loop is terminated in the example?",
        ["Stop and turn off lights", "Move backward and display red lights", "Move forward and play music", "Turn left and display yellow lights"],
        1,
        "After exiting the loop, the robot moves backward and displays red lights."
      ),
    ]
  },
  // Lesson 23: Temperature Sensor
  {
    id: 23,
    grade: 4,
    title: "Temperature Sensor",
    subtitle: "Environmental monitoring",
    color: COLORS.c23,
    content: [
      { type: "h", text: "What is Temperature?" },
      { type: "p", text: "Temperature is a physical quantity that expresses how hot or cold something is. It is measured with an instrument called a thermometer, which uses specific scales to display the readings." },
      { type: "p", text: "The most commonly used scales around the world are the Celsius scale (denoted as °C), the Fahrenheit scale (°F), and the Kelvin scale (K)." },
      { type: "h", text: "Ranger's Temperature Sensor Component" },
      { type: "p", text: "The mBot Ranger features an onboard thermistor temperature sensor. This sensor module constantly tracks changes in temperature within its surroundings and translates them into live numerical values that the robot brain can read and process." },
      { type: "h", text: "Coding with Temperature Scales" },
      { type: "p", text: "To access weather or heat data, we open the light blue Sense Block category and look for the specific oval sensor statement:" },
      { type: "ul", items: ["[ temperature sensor onboard temperature (°C) ] — This sensor reading block must be snapped inside comparison math logic blocks or conditional loops to help the robot evaluate situational data changes."] },
    ],
    quiz: [
      // Activity 1: Multiple Choice (3 questions)
      quizQuestion(
        "What is the physical quantity that expresses how hot or cold an environment is?",
        ["Distance value", "Sound intensity", "Temperature", "Brightness"],
        2,
        "Temperature measures hotness or coldness."
      ),
      quizQuestion(
        "Which metric scale notation is standard for tracking temperature readings on your robot?",
        ["Degrees Celsius (°C)", "Decibel loops", "Centimeter steps", "Lux units"],
        0,
        "The robot uses Celsius for temperature readings."
      ),
      quizQuestion(
        "The onboard temperature sensor code block is located inside which color-coded category?",
        ["Move Category", "Sense Category", "Control Category", "Data Category"],
        1,
        "Temperature sensing is in the Sense category."
      ),
      // Activity 2: Code Analysis (2 questions)
      quizQuestion(
        "What actions will the robot perform if the onboard sensor reads a temperature of 25°C (True path)?",
        ["Flash red lights and turn left", "Flash yellow lights and turn left", "Play musical tones and drive forward", "Stop and sound alarm"],
        1,
        "If temperature is less than 20 (False), it executes the else branch: flash yellow lights and turn left."
      ),
      quizQuestion(
        "What complete execution path does the robot switch to if the environment drops to 18°C (False path)?",
        ["Flash red lights and turn left", "Flash yellow lights and turn left", "Play musical tones and drive forward", "Stop and sound alarm"],
        2,
        "If temperature is greater than 20 (True), it plays musical tones and drives forward continuously."
      ),
    ]
  },
  // Lesson 24: Line Follower Sensor
  {
    id: 24,
    grade: 4,
    title: "Line Follower Sensor",
    subtitle: "Path tracking",
    color: COLORS.c24,
    content: [
      { type: "h", text: "What is a Line Follower Sensor?" },
      { type: "p", text: "A line follower sensor is an input device that allows a robot to detect and trace a pathway drawn on a surface." },
      { type: "p", text: "The sensor module contains 2 individual sensors (Sensor 1 and Sensor 2) positioned side-by-side. These sensors detect contrasting surfaces by reading reflections between black and white colors within a close operational range of 1 to 2 centimeters." },
      { type: "h", text: "Logic Combinations & Values" },
      { type: "p", text: "Each of the two sensors returns a simple binary value to the main controller board to determine how the robot moves:" },
      { type: "ul", items: ["A value of 0 is returned when a black surface or dark line is successfully detected.", "A value of 1 is returned when a white surface or light-colored background is detected."] },
      { type: "h", text: "The Four Coding Rules" },
      { type: "ul", items: ["Both Sensors on Black (0, 0): The robot moves straight forward along the line.", "Left Sensor on White, Right Sensor on Black (1, 0): The robot steers or turns to follow the line curve.", "Left Sensor on Black, Right Sensor on White (0, 1): The robot adjusts its steering to correct its course.", "Both Sensors on White (1, 1): The robot moves backward to find the lost track!"] },
    ],
    quiz: [
      // Activity 1: Vocabulary Check (3 questions)
      quizQuestion(
        "How many individual sensors are built onto a standard line follower module?",
        ["Three sensors", "Two sensors", "Five sensors", "Four sensors"],
        1,
        "The module has 2 sensors side-by-side."
      ),
      quizQuestion(
        "What numerical value is sent to the robot brain when a sensor detects a dark black line?",
        ["A value of 0", "A value of 1", "A value of 2", "A value of 3"],
        0,
        "Black returns 0."
      ),
      quizQuestion(
        "What is the optimal distance detection range for the line follower sensor?",
        ["10 to 20 centimeters", "1 to 2 centimeters", "5 to 6 centimeters", "8 to 10 centimeters"],
        1,
        "The sensor works best within 1-2 cm."
      ),
      // Activity 2: Code Analysis (2 questions)
      quizQuestion(
        "In what direction does the robot move when the line follower sensor returns a value of 0 (black line detected)?",
        ["Forward", "Backward", "Left", "Right"],
        0,
        "The robot moves forward when it detects the black line."
      ),
      quizQuestion(
        "What action does the robot take if the tracking value changes from 0 to 1 (white detected)?",
        ["Continue forward", "Adjust steering to correct course", "Stop moving", "Move backward"],
        1,
        "When a sensor detects white while the other sees black, the robot adjusts its steering to find the line again."
      ),
    ]
  },
  // Lesson 25: Play Note Block
  {
    id: 25,
    grade: 4,
    title: "Play Note Block",
    subtitle: "Musical programming",
    color: COLORS.c25,
    content: [
      { type: "h", text: "The Science of Music and Sound" },
      { type: "p", text: "Sound is a vibration that travels through the air as a wave. Music is a beautiful pattern of sounds produced by singing or playing instruments." },
      { type: "p", text: "Music is a great addition to robotics because it improves memory, raises academic performance, reduces stress, and makes our interactive programs fun to hear!" },
      { type: "h", text: "Generating Sound on the mBot Ranger" },
      { type: "p", text: "The mBot Ranger contains a built-in electrical device called a buzzer that produces beep tones to create a melody. We command it using the Play Note Block found under the blue Show Block palette category." },
      { type: "h", text: "The Two Musical Properties" },
      { type: "p", text: "When configuring a play note block, you specify two distinct parameters:" },
      { type: "ul", items: ["Pitch (Musical Note Selector): Controls how high or low the note sounds (e.g., C5, D5, E5, F5, G5, A5, B5, C6).", "Duration (Beat Selector): Controls how long the note is held (e.g., eighth beat, quarter beat, half beat, whole beat, double beat)."] },
    ],
    quiz: [
      // Activity 1: Multiple Choice (3 questions)
      quizQuestion(
        "What is an electrical hardware component that produces audible beep tones on a robot?",
        ["Motor Actuator", "Buzzer", "Light Sensor Window", "Camera"],
        1,
        "The buzzer produces beep tones."
      ),
      quizQuestion(
        "A vibration that travels physically through the air to reach our ears is called:",
        ["Sound", "Code Block", "Illuminance Value", "Temperature"],
        0,
        "Sound is a vibration traveling through air."
      ),
      quizQuestion(
        "The length of time a musical note plays or continues to ring is called its:",
        ["Pitch", "Beat or Duration", "Metric Scale", "Amplitude"],
        1,
        "Beat/Duration controls how long the note plays."
      ),
      // Activity 2: Code Analysis (2 questions)
      quizQuestion(
        "What famous children's nursery rhyme does the sequence of custom code blocks play in the example?",
        ["Happy Birthday", "Twinkle Twinkle Little Star", "Mary Had a Little Lamb", "Jingle Bells"],
        1,
        "The sequence plays 'Twinkle Twinkle Little Star'."
      ),
      quizQuestion(
        "Which note inside the code segment stays active or rings out for the longest period of time?",
        ["The first note", "The note with the longest beat duration", "The highest pitch note", "The lowest pitch note"],
        1,
        "The note with the longest beat duration (like a whole beat) stays active the longest."
      ),
    ]
  },
  // Lesson 26: Relational Operators
  {
    id: 26,
    grade: 4,
    title: "Relational Operators",
    subtitle: "Value comparison",
    color: COLORS.c26,
    content: [
      { type: "h", text: "What are Relational Operators?" },
      { type: "p", text: "A relational operator is a coding block used to compare two values or numerical data points against each other." },
      { type: "p", text: "When our robot evaluates this comparison, the block returns a binary result: either True if the comparison is correct, or False if the comparison is incorrect. This helps conditional statements make smart path choices!" },
      { type: "h", text: "The 3 Essential Operator Blocks" },
      { type: "p", text: "The green Operators block category includes three foundational comparison math tools:" },
      { type: "ul", items: ["[ ] < [ ] — Less Than: Checks if the first number is smaller than the second.", "[ ] = [ ] — Equal To: Checks if both numbers are exactly the same.", "[ ] > [ ] — Greater Than: Checks if the first number is larger than the second."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "Relational operators are used to combine long text strings together.",
        ["TRUE", "FALSE"],
        1,
        "Relational operators compare numbers, not text strings."
      ),
      quizQuestion(
        "The less than sign checks if the first number is smaller than the second number.",
        ["TRUE", "FALSE"],
        0,
        "< checks if the first is smaller."
      ),
      quizQuestion(
        "If a robot compares 50 = 50, the relational operator block returns a value of True.",
        ["TRUE", "FALSE"],
        0,
        "50 equals 50, so the comparison is True."
      ),
      quizQuestion(
        "Relational operator blocks are located inside the dark purple Data category.",
        ["TRUE", "FALSE"],
        1,
        "They are in the green Operators category."
      ),
      // Activity 2: Code Analysis (2 questions)
      quizQuestion(
        "What path action does the robot execute if the distance sensor measures an item at 80 in the code example?",
        ["Move forward", "Stop moving and move backward", "Turn left", "Turn right"],
        1,
        "If distance < 100, the robot stops and moves backward."
      ),
      quizQuestion(
        "What driving action takes place if the distance sensor measures an item at 600 in the code example?",
        ["Move forward", "Stop moving and move backward", "Turn left", "Turn right"],
        0,
        "If distance > 500, the robot moves forward for 1 second."
      ),
    ]
  },
  // Lesson 27: Boolean Operators
  {
    id: 27,
    grade: 4,
    title: "Boolean Operators",
    subtitle: "Logical combining",
    color: COLORS.c27,
    content: [
      { type: "h", text: "What are Boolean Operators?" },
      { type: "p", text: "A Boolean operator is a specialized coding block used to validate and test multiple expressions at the same time!" },
      { type: "p", text: "Named after mathematician George Boole, these blocks combine separate conditional comparisons. The final outcome of a Boolean combination always results in a single binary answer: either True or False." },
      { type: "h", text: "The 3 Core Boolean Blocks" },
      { type: "p", text: "The green Operators category contains three foundational logical connector blocks:" },
      { type: "ul", items: ["[ AND ] — Returns True ONLY if ALL conditions are True.", "[ OR ] — Returns True if ANY ONE condition is True.", "[ NOT ] — Reverses the result (True becomes False, False becomes True)."] },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "Boolean operators allow a robot to evaluate multiple condition blocks at once.",
        ["TRUE", "FALSE"],
        0,
        "Boolean operators combine multiple conditions."
      ),
      quizQuestion(
        "The AND block returns True even if only one condition matches correctly.",
        ["TRUE", "FALSE"],
        1,
        "AND requires ALL conditions to be True."
      ),
      quizQuestion(
        "The NOT block reverses a logical condition, swapping True for False.",
        ["TRUE", "FALSE"],
        0,
        "NOT inverts the logical result."
      ),
      quizQuestion(
        "The OR block requires every single expression inside it to be correct to result in True.",
        ["TRUE", "FALSE"],
        1,
        "OR requires only ONE condition to be True."
      ),
      // Activity 2: Code Analysis (2 questions)
      quizQuestion(
        "What color do the LED panel lights turn if the light intensity reads 250 in the example?",
        ["Red", "Green", "Blue", "Yellow"],
        2,
        "If light intensity is between 200 and 400, the LEDs turn Blue."
      ),
      quizQuestion(
        "What happens to the LEDs if the surrounding light level climbs up to 600 in the example?",
        ["Turn Red", "Turn Green", "Turn Blue", "Turn Off"],
        0,
        "If light intensity > 400, the LEDs turn Red."
      ),
    ]
  },
  // Lesson 28: Combining Data and New Block Blocks
  {
    id: 28,
    grade: 4,
    title: "Combining Data and New Blocks",
    subtitle: "Integrated programming",
    color: COLORS.c28,
    content: [
      { type: "h", text: "What is Code Integration?" },
      { type: "p", text: "Code Integration means bringing different programming tools together to solve advanced problems! In this lesson, we combine Data Blocks (Variables) with User-defined Blocks (Custom Functions)." },
      { type: "p", text: "By using variables to keep track of counts and using custom blocks to store complex tasks, we can make our robot run through a clean checklist of organized actions dynamically." },
      { type: "h", text: "Key Elements of an Integrated Program" },
      { type: "ul", items: ["1. Custom Blocks: Bundles a complex sequence of physical actions under a single named shortcut block.", "2. Counter Variables: Acts as a digital tracking box to monitor and update how many times an action runs."] },
      { type: "h", text: "The Main Execution Flow" },
      { type: "p", text: "Inside the main loop, conditional selection structures check the current value of your variable. As the variable increases step-by-step, the robot switches seamlessly from executing one custom block task to the next!" },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "Combining custom blocks with data variables makes complex robot code easier to control.",
        ["TRUE", "FALSE"],
        0,
        "Integration simplifies complex code management."
      ),
      quizQuestion(
        "Counter variables are used to store names of custom block shortcuts.",
        ["TRUE", "FALSE"],
        1,
        "Counter variables track numbers, not names."
      ),
      quizQuestion(
        "Changing a variable value inside a loop can trigger different custom blocks in sequence.",
        ["TRUE", "FALSE"],
        0,
        "Variable changes can switch between tasks."
      ),
      quizQuestion(
        "Custom block definitions are coded inside the green Operator category palette.",
        ["TRUE", "FALSE"],
        1,
        "Custom blocks are in the pink Blocks category."
      ),
      // Activity 2: Code Analysis (3 questions)
      quizQuestion(
        "What is the initial starting value of the tracking data variable named Task in the example?",
        ["0", "1", "2", "3"],
        0,
        "Task is initially set to 0."
      ),
      quizQuestion(
        "Which custom block task runs first when the main loop starts up?",
        ["Task 1", "Task 2", "Task 3", "Task 4"],
        0,
        "Task 1 runs first when Task = 0."
      ),
      quizQuestion(
        "At what precise numerical value does the forever-until loop stop and terminate in the example?",
        ["2", "3", "4", "5"],
        1,
        "The loop terminates when Task reaches 3."
      ),
    ]
  },
  // Lesson 29: Advanced Math - Even and Round
  {
    id: 29,
    grade: 4,
    title: "Advanced Math - Even and Round",
    subtitle: "Number processing",
    color: COLORS.c29,
    content: [
      { type: "h", text: "Advanced Math Operators in Coding" },
      { type: "p", text: "Robots interact with the world by taking raw sensor data numbers and processing them. Sometimes, sensors give us messy decimal numbers or changing patterns. To help our robot make clean decisions, we use special green Operator Blocks called Even and Round blocks!" },
      { type: "h", text: "Understanding the Blocks" },
      { type: "ul", items: ["1. Is Even Block: [ ] is even — Checks a number value. Returns True if the number is even, or False if it is odd.", "2. Round Block: round — Takes a decimal number and converts it into the nearest whole integer. For example, rounding 4.7 gives 5, and rounding 4.2 gives 4."] },
      { type: "h", text: "How They Help Our Robots Choose" },
      { type: "p", text: "By combining these blocks inside an if-then-else structure, a robot can change its actions based on math patterns. It can toggle its LED panel colors back and forth between even and odd loops, or smooth out changing distance readings." },
    ],
    quiz: [
      // Activity 1: Vocabulary and Math Check (3 questions)
      quizQuestion(
        "Which block converts a decimal number (like 12.8) into its nearest whole integer number?",
        ["Is Even block", "Round block", "Reset block", "Data block"],
        1,
        "The Round block rounds decimals to integers."
      ),
      quizQuestion(
        "If you place the number 7 inside the '[ ] is even' block, what value will it return?",
        ["True", "False", "0", "7"],
        1,
        "7 is odd, so it returns False."
      ),
      quizQuestion(
        "Rounding off a distance reading of 15.4 using the round block outputs:",
        ["15", "16", "15.40", "15.00"],
        0,
        "15.4 rounds down to 15."
      ),
      // Activity 2: Code Analysis (3 questions)
      quizQuestion(
        "What color does the LED panel display first when the program starts up and the value is 1?",
        ["Red", "Green", "Blue", "Yellow"],
        0,
        "When the value is odd (1), the LED shows Red."
      ),
      quizQuestion(
        "What color does the LED panel change to on the second loop iteration when the value becomes 2?",
        ["Red", "Green", "Blue", "Yellow"],
        1,
        "When the value becomes even (2), the LED changes to Green."
      ),
      quizQuestion(
        "At what precise variable value does this entire loop terminate?",
        ["5", "10", "15", "20"],
        1,
        "The loop terminates when the variable reaches 10."
      ),
    ]
  },
  // Lesson 30: Debugging
  {
    id: 30,
    grade: 4,
    title: "Debugging",
    subtitle: "Finding and fixing errors",
    color: COLORS.c30,
    content: [
      { type: "h", text: "What is a Bug and Debugging?" },
      { type: "p", text: "In computer programming, a bug is an error, flaw, or mistake in a program that causes it to behave unexpectedly or give the wrong output." },
      { type: "p", text: "The process of finding, tracking, and correcting these logical mistakes to achieve your desired goal is called debugging! Programmers use a strategy called the trial and error method to test and fix their code step by step." },
      { type: "h", text: "Common Types of Program Errors" },
      { type: "ul", items: ["Syntax Errors: Mistakes in the grammar or rules of the language that stop the code from running at all.", "Logical Errors: The code runs fine, but it takes the wrong actions or does the math incorrectly."] },
      { type: "h", text: "The Debugger's Checklist" },
      { type: "ul", items: ["Initial Values: Did your variable start at the correct number?", "Comparison Targets: Are you checking the right limit?", "Direction Adjustments: Is your variable increasing or decreasing in the correct direction?"] },
    ],
    quiz: [
      // Activity 1: Multiple Choice (3 questions)
      quizQuestion(
        "A mistake or error inside a block code program that causes a robot to behave incorrectly is called a:",
        ["Shortcut block", "Bug", "Loop container", "Data block"],
        1,
        "A bug is an error in the code."
      ),
      quizQuestion(
        "What do we call the process of finding and fixing mistakes inside our program scripts?",
        ["Debugging", "Initializing", "Modularity", "Testing"],
        0,
        "Debugging is fixing code errors."
      ),
      quizQuestion(
        "Testing multiple variations of code sequences to find a solution that works is known as the:",
        ["Selection method", "Trial and error method", "Core sensor method", "Looping method"],
        1,
        "Trial and error is the debugging approach."
      ),
      // Activity 2: Code Analysis (3 questions)
      quizQuestion(
        "In the broken light sequence program, the robot ring has 12 discrete LEDs. To check all of them correctly, the comparison block value target should be changed from 12 to what number?",
        ["10", "11", "12", "13"],
        2,
        "The comparison should check up to 12 to include all 12 LEDs."
      ),
      quizQuestion(
        "To make the light sequence move backwards in a counter-clockwise direction, should the variable value be changed by +1 (increment) or -1 (decrement)?",
        ["Increment (+1)", "Decrement (-1)"],
        1,
        "Decrementing (-1) makes the sequence move backwards."
      ),
      quizQuestion(
        "What was the incorrect initial value assigned to the variable LED at the start of the program?",
        ["0", "1", "2", "3"],
        0,
        "The variable LED was incorrectly set to 0 instead of 1."
      ),
    ]
  },
  // Lesson 31: Worded Problems
  {
    id: 31,
    grade: 4,
    title: "Worded Problems",
    subtitle: "Text to code translation",
    color: COLORS.c31,
    content: [
      { type: "h", text: "Translating Text to Math Equations" },
      { type: "p", text: "Robots are built to help solve human problems. To make a robot solve a real-world story or a worded problem, a programmer must understand how to translate text statements into mathematical equations that code blocks can process!" },
      { type: "h", text: "The Programmer's Translation Guide" },
      { type: "p", text: "Look at how regular sentences match up directly with math expressions:" },
      { type: "ul", items: ["'The current Year has increased by five' ⇒ Year + 5", "'Peter's age is greater than Mary's age' ⇒ Age_Peter > Age_Mary", "'Twice the age of Peter equals thrice the age of Mary' ⇒ Age_Peter × 2 = Age_Mary × 3"] },
      { type: "h", text: "Storing and Comparing Stories in Code" },
      { type: "p", text: "We use variables as digital boxes to represent characters or amounts from our word stories. Then, we snap relational math blocks into our if-then-else control blocks to evaluate the story's facts!" },
    ],
    quiz: [
      // Activity 1: Translation Match (3 items)
      quizQuestion(
        "'Lana's total marbles is equal to 12' translates to:",
        ["Income > Expense", "Marbles = 12", "John_Age = Amy_Age - 10"],
        1,
        "Equal to 12 means = 12."
      ),
      quizQuestion(
        "'John's age is ten years younger than Amy's age' translates to:",
        ["Income > Expense", "Marbles = 12", "John_Age = Amy_Age - 10"],
        2,
        "Ten years younger means subtract 10 from Amy."
      ),
      quizQuestion(
        "'The total business income is greater than the expense' translates to:",
        ["Income > Expense", "Marbles = 12", "John_Age = Amy_Age - 10"],
        0,
        "Greater than uses the > operator."
      ),
      // Activity 2: Code Analysis (2 questions)
      quizQuestion(
        "Is the condition statement (Income > Expense) evaluated as True or False based on the variable initial values?",
        ["True", "False"],
        0,
        "If Income = 100 and Expense = 50, then 100 > 50 is True."
      ),
      quizQuestion(
        "Describe what driving action and light signaling color the robot performs when the program is executed:",
        ["Move forward with green lights", "Move backward with red lights", "Turn left with yellow lights", "Stop with blue lights"],
        0,
        "When Income > Expense is True, the robot moves forward with green lights."
      ),
    ]
  },
  // Lesson 32: Random and Remainder Blocks
  {
    id: 32,
    grade: 4,
    title: "Random and Remainder Blocks",
    subtitle: "Games and modulo arithmetic",
    color: COLORS.c32,
    content: [
      { type: "h", text: "Random Integer Block and Remainder Block" },
      { type: "p", text: "The green Operators category contains two special blocks that enable fun and useful programming patterns:" },
      { type: "ul", items: ["[ random integer from 1 to 12 ] — Picks an unpredictable whole number within a given range. Every value from the minimum to the maximum has an equal chance to be chosen.", "[ remainder of [ ] divided by [ ] ] — Calculates the leftover after division. For example, 14 ÷ 12 = 1 with a remainder of 2."] },
      { type: "h", text: "The Roulette Game Concept" },
      { type: "p", text: "By using the random block to pick a number from 1 to 12, we can build a game of chance on our robot! The robot can use the remainder block to calculate which single LED out of its 12 light ring should switch on every 5 seconds." },
    ],
    quiz: [
      // Activity 1: True or False (4 questions)
      quizQuestion(
        "The random integer block can pick unpredictable numbers within a specified scale range.",
        ["TRUE", "FALSE"],
        0,
        "Random blocks pick unpredictable numbers."
      ),
      quizQuestion(
        "The remainder block gives the full decimal answer of a division calculation.",
        ["TRUE", "FALSE"],
        1,
        "Remainder gives the leftover, not the decimal."
      ),
      quizQuestion(
        "The remainder of the number 14 divided by 12 is equal to 2.",
        ["TRUE", "FALSE"],
        0,
        "14 ÷ 12 = 1 remainder 2, so the remainder is 2."
      ),
      quizQuestion(
        "Integer-valued blocks are located inside the light blue Sense category palette.",
        ["TRUE", "FALSE"],
        1,
        "These are in the green Operators category."
      ),
      // Activity 2: Code Analysis (3 questions)
      quizQuestion(
        "What is the range of potential values that the custom variable Pick can store in the roulette example?",
        ["1 to 10", "1 to 12", "1 to 20", "1 to 100"],
        1,
        "The random integer block picks from 1 to 12."
      ),
      quizQuestion(
        "How long does the robot wait before selecting and updating to a new random LED light index?",
        ["1 second", "5 seconds", "10 seconds", "30 seconds"],
        1,
        "The wait block pauses for 5 seconds."
      ),
      quizQuestion(
        "What is the specific name of the user-defined block that generates the random value in the roulette example?",
        ["Roulette", "RandomPick", "Spin", "ChooseLED"],
        0,
        "The custom block is named Roulette."
      ),
    ]
  },
];