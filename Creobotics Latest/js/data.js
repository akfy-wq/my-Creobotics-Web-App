// data.js
// Location: js/data.js
//
// Static content for Creobotics: the 5 eBook modules and their quizzes.
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

// Grade levels Creobotics supports, Grade 4 through Grade 12 (Senior High).
// Grade 4 ships with the 5 built-in modules below. Grades 5-12 start empty —
// an admin uploads modules for a grade (see the Admin page) to make that
// grade appear as "available" to students. Grades 11-12 are flagged as
// Senior High for display purposes only.
const GRADES = [
  { level: 4, label: "Grade 4", seniorHigh: false },
  { level: 5, label: "Grade 5", seniorHigh: false },
  { level: 6, label: "Grade 6", seniorHigh: false },
  { level: 7, label: "Grade 7", seniorHigh: false },
  { level: 8, label: "Grade 8", seniorHigh: false },
  { level: 9, label: "Grade 9", seniorHigh: false },
  { level: 10, label: "Grade 10", seniorHigh: false },
  { level: 11, label: "Grade 11", seniorHigh: true },
  { level: 12, label: "Grade 12", seniorHigh: true },
];

// Grade 4 ships with built-in modules (below), while Grades 5-12 start empty
// until an admin uploads content. This does NOT mean Grade 4 is free —
// EVERY grade (4 through 12) requires an active, unexpired serial key to
// access. See redeemSerialKey() and hasActiveAccess() in app.js.
const BUILTIN_GRADE = 4;

const MODULES = [
  {
    id: 1,
    grade: 4,
    title: "Elements of a Robot",
    subtitle: "Sense, Compute, and Act!",
    color: "var(--mod-1)",
    content: [
      { type: "h", text: "What Makes Something a Robot?" },
      { type: "p", text: "Every robot, no matter how simple or advanced, is built around the same three-part cycle: it senses the world, computes a decision, and then acts on that decision. This module breaks down each of those three elements and shows how they work together to create intelligent, responsive machines." },
      { type: "h", text: "1. Sense" },
      { type: "p", text: "Sensing is how a robot gathers information about its surroundings. Without sensing, a robot has no way of knowing what is happening around it, and cannot react safely or usefully." },
      { type: "ul", items: [
        "Distance sensors detect how far away obstacles are.",
        "Cameras let a robot 'see' shapes, colors, and objects.",
        "Touch and pressure sensors detect contact and grip strength.",
        "Microphones allow robots to detect sound and voice commands."
      ]},
      { type: "h", text: "2. Compute" },
      { type: "p", text: "Computing is the 'thinking' stage. A microcontroller or onboard computer takes in the sensor data and decides what the robot should do next, based on either fixed logic (if X, then Y) or, in more advanced robots, machine learning models trained on data." },
      { type: "h", text: "3. Act" },
      { type: "p", text: "Acting is how a robot carries out its decision in the physical world. This is usually done through motors and actuators that move wheels, arms, or other mechanical parts." },
      { type: "ul", items: [
        "DC motors spin wheels for movement.",
        "Servo motors rotate to a precise angle, useful for arms and grippers.",
        "Actuators can also include lights, speakers, or displays for feedback."
      ]},
      { type: "h", text: "Why This Cycle Matters" },
      { type: "p", text: "The sense-compute-act loop repeats continuously, often many times per second, allowing a robot to respond to a constantly changing environment instead of just following a single fixed script. Understanding this loop is the foundation for everything else you'll learn about robotics in Creobotics." }
    ],
    quiz: [
      { q: "What are the three core stages every robot cycles through?", options: ["Sense, Compute, Act", "Build, Test, Ship", "Power, Sleep, Wake", "Start, Pause, Stop"], correct: 0, explanation: "Every robot repeats Sense (gather data), Compute (decide), and Act (move/respond) — the other options describe development or power states, not the robot's operating loop." },
      { q: "Which component allows a robot to 'see' its surroundings?", options: ["Speaker", "Camera", "Battery", "Wheel"], correct: 1, explanation: "A camera captures visual information from the environment. Speakers output sound, batteries store power, and wheels handle movement — none of them sense surroundings." },
      { q: "What happens during the 'Compute' stage?", options: ["The robot moves", "The robot charges", "The robot decides what to do next", "The robot senses sound"], correct: 2, explanation: "Compute is the 'thinking' stage, where the robot processes sensor data and decides what action to take. Moving happens during Act, and sensing happens during Sense." },
      { q: "Which motor type can rotate to a precise angle?", options: ["DC motor", "Servo motor", "Jet engine", "Piston"], correct: 1, explanation: "Servo motors accept a target angle and rotate precisely to it, which is why they're used for steering and joints. A plain DC motor just spins continuously without angle control." },
      { q: "Why does the sense-compute-act loop repeat continuously?", options: ["To save battery", "To respond to a changing environment", "To reduce cost", "To avoid using sensors"], correct: 1, explanation: "The environment keeps changing, so the robot must keep sensing and recalculating its next move in order to react appropriately in real time." },
      { q: "Touch and pressure sensors are mainly used to detect:", options: ["Sound frequency", "Physical contact and grip strength", "Wireless signals", "Ambient light color"], correct: 1, explanation: "Touch and pressure sensors measure physical contact and force, such as when a gripper is holding an object firmly enough — not sound, signals, or light." }
    ]
  },
  {
    id: 2,
    grade: 4,
    title: "Robot's Hardware",
    subtitle: "Physical components and their classifications",
    color: "var(--mod-2)",
    content: [
      { type: "h", text: "Understanding Robot Hardware" },
      { type: "p", text: "Hardware refers to every physical part of a robot you can actually touch: its frame, its motors, its wiring, and its circuit boards. This module classifies robot hardware into clear categories so you can recognize the role each part plays." },
      { type: "h", text: "Structural Hardware" },
      { type: "p", text: "This is the robot's skeleton — the frame or chassis that holds everything together and determines the robot's overall shape and size." },
      { type: "ul", items: [
        "Lightweight plastic or acrylic for small hobby robots.",
        "Aluminum extrusions for modular educational kits.",
        "Reinforced metal for heavy-duty industrial robots."
      ]},
      { type: "h", text: "Electronic Hardware" },
      { type: "p", text: "This category includes the microcontroller board, wiring, connectors, and power management circuits that let electricity and data move through the robot safely and reliably." },
      { type: "ul", items: [
        "Microcontroller boards (the 'brain' hardware) process instructions.",
        "Wiring harnesses connect sensors and motors to the controller.",
        "Voltage regulators keep power steady for sensitive components."
      ]},
      { type: "h", text: "Mechanical Hardware" },
      { type: "p", text: "Mechanical hardware converts electrical signals into physical motion — gears, motors, wheels, joints, and grippers all fall into this category." },
      { type: "ul", items: [
        "Gears change speed and torque between motor and wheel.",
        "Wheels or tracks let a robot travel across surfaces.",
        "Joints and linkages allow robotic arms to bend and reach."
      ]},
      { type: "h", text: "Power Hardware" },
      { type: "p", text: "Every robot needs a reliable power source. Rechargeable lithium batteries are the most common choice for mobile robots because they are lightweight and hold a strong charge relative to their size." },
      { type: "h", text: "Classifying Hardware by Purpose" },
      { type: "p", text: "A useful habit when studying any robot is to ask: 'Is this piece structural, electronic, mechanical, or power-related?' Doing this for every component you encounter will make it much easier to understand — and eventually design — your own robots." }
    ],
    quiz: [
      { q: "What does 'hardware' refer to in a robot?", options: ["Only the software code", "Every physical part you can touch", "Only the battery", "The robot's name"], correct: 1, explanation: "Hardware means the physical parts of the robot — frame, motors, sensors, wiring, and so on. Software is the code that runs on that hardware, which is a separate concept." },
      { q: "Which category does a robot's frame or chassis belong to?", options: ["Structural hardware", "Power hardware", "Software", "Cloud storage"], correct: 0, explanation: "The chassis/frame gives the robot its physical shape and holds everything together, which makes it structural hardware — not power, code, or storage." },
      { q: "Voltage regulators are part of which hardware category?", options: ["Mechanical", "Electronic", "Structural", "None of these"], correct: 1, explanation: "Voltage regulators manage and control electrical current, so they belong to electronic hardware rather than mechanical or structural parts." },
      { q: "Gears and joints are examples of:", options: ["Power hardware", "Electronic hardware", "Mechanical hardware", "Cloud hardware"], correct: 2, explanation: "Gears and joints are physical, moving mechanical parts that transmit motion — they don't store power or process electronic signals." },
      { q: "Why are lithium batteries popular for mobile robots?", options: ["They are heavy and bulky", "They are lightweight with strong charge relative to size", "They never need charging", "They are the cheapest option always"], correct: 1, explanation: "Lithium batteries pack a lot of energy into a small, light package, which matters a lot for mobile robots that need to carry their own power supply." },
      { q: "A good habit when studying a robot's hardware is to ask:", options: ["How much does it cost?", "Is this structural, electronic, mechanical, or power-related?", "What color is it?", "Who invented it?"], correct: 1, explanation: "Sorting a part into structural, electronic, mechanical, or power helps you understand its role in the robot — cost, color, and inventor don't explain function." }
    ]
  },
  {
    id: 3,
    grade: 4,
    title: "Assembling a Robot",
    subtitle: "Connecting hardware to build a form",
    color: "var(--mod-3)",
    content: [
      { type: "h", text: "From Parts to a Working Machine" },
      { type: "p", text: "Having the right hardware is only half the job — a robot only comes to life once its parts are correctly assembled into a working form. This module walks through the general process of taking individual components and turning them into a functioning robot." },
      { type: "h", text: "Step 1: Plan the Layout" },
      { type: "p", text: "Before attaching anything, sketch out where each part will go. Consider weight distribution, so the robot doesn't tip over, and leave room for wiring so cables don't tangle with moving parts." },
      { type: "h", text: "Step 2: Build the Frame" },
      { type: "p", text: "Assemble the chassis first. This gives you a stable base to mount everything else onto, and makes it much easier to test-fit other components as you go." },
      { type: "h", text: "Step 3: Mount the Mechanical Parts" },
      { type: "p", text: "Attach motors, wheels, and any joints or arms to the frame. Make sure moving parts have enough clearance and are firmly secured — a loose motor mount is one of the most common causes of erratic robot behavior." },
      { type: "ul", items: [
        "Secure motors with screws rather than glue or tape.",
        "Check that wheels spin freely without rubbing the frame.",
        "Test joints by hand before powering them electronically."
      ]},
      { type: "h", text: "Step 4: Install Electronics" },
      { type: "p", text: "Mount the microcontroller board, then connect sensors and motors according to the wiring diagram. Keep wiring neat and labeled — this makes troubleshooting far easier later." },
      { type: "h", text: "Step 5: Power and Test" },
      { type: "p", text: "Connect the battery last, after double-checking all connections. Run a simple test program that moves one motor or reads one sensor at a time, rather than testing everything at once, so any problems are easy to isolate." },
      { type: "h", text: "Common Assembly Mistakes" },
      { type: "ul", items: [
        "Wiring sensors backward (check polarity before connecting power).",
        "Overloading a motor with more weight than it can handle.",
        "Forgetting to secure loose wires away from moving wheels or gears."
      ]},
      { type: "p", text: "Careful, methodical assembly is one of the most valuable skills in robotics — a well-built robot is far easier to program and troubleshoot than a rushed one." }
    ],
    quiz: [
      { q: "What should you do before attaching any parts to a robot?", options: ["Turn on the power immediately", "Plan the layout and weight distribution", "Paint the frame", "Write the final code"], correct: 1, explanation: "Planning the layout and weight distribution first prevents balance issues and rework later — powering on or coding before assembly makes little sense." },
      { q: "Why build the chassis first?", options: ["It looks nicer", "It gives a stable base for mounting other parts", "It uses the least electricity", "It is required by law"], correct: 1, explanation: "The chassis is the foundation everything else attaches to, so building it first gives you a stable base to mount motors, sensors, and electronics onto." },
      { q: "What is a common cause of erratic robot behavior?", options: ["Too much paint", "A loose motor mount", "Using a heavier battery", "Bright lighting in the room"], correct: 1, explanation: "A loose motor mount causes inconsistent movement and vibration, which shows up as unpredictable, erratic behavior — paint and lighting don't affect motor performance directly." },
      { q: "When should the battery be connected during assembly?", options: ["First, before anything else", "Last, after double-checking connections", "It doesn't matter when", "Only after the robot is painted"], correct: 1, explanation: "Connecting the battery last, after verifying all wiring, avoids short circuits or damage from powering up a partially or incorrectly wired robot." },
      { q: "Why test one motor or sensor at a time rather than everything at once?", options: ["It saves battery permanently", "It makes problems easier to isolate", "It is required by the manufacturer", "It makes the robot faster"], correct: 1, explanation: "Testing one part at a time makes it much easier to pinpoint exactly which component is causing a problem, instead of guessing among several at once." },
      { q: "Which of these is a common wiring mistake?", options: ["Labeling wires clearly", "Connecting a sensor backward (wrong polarity)", "Using screws to secure motors", "Testing joints by hand first"], correct: 1, explanation: "Reversing polarity when wiring a sensor is a frequent beginner mistake that can damage components or cause the sensor to malfunction." }
    ]
  },
  {
    id: 4,
    grade: 4,
    title: "Makeblock Application",
    subtitle: "Communication and Control",
    color: "var(--mod-4)",
    content: [
      { type: "h", text: "Controlling Robots Through Software" },
      { type: "p", text: "Makeblock-style platforms pair physical robot kits with companion apps that let you program, control, and monitor your robot from a phone, tablet, or computer. This module introduces how that communication and control layer works." },
      { type: "h", text: "How the App Talks to the Robot" },
      { type: "p", text: "Most educational robot kits communicate wirelessly using Bluetooth or Wi-Fi. The app sends small packets of data — commands like 'move forward' or 'turn 90 degrees' — which the robot's onboard controller receives and translates into motor actions." },
      { type: "ul", items: [
        "Bluetooth is common for short-range, low-power control.",
        "Wi-Fi allows longer range and can support live video streaming.",
        "Commands are typically sent as small structured messages, not raw code."
      ]},
      { type: "h", text: "Block-Based Programming" },
      { type: "p", text: "Many robotics apps use block-based programming, where visual blocks like 'move forward,' 'wait 2 seconds,' or 'turn left' snap together like puzzle pieces. This lowers the barrier to entry, letting beginners build real robot behavior without needing to memorize programming syntax." },
      { type: "h", text: "Real-Time Control Mode" },
      { type: "p", text: "In addition to programming ahead of time, most apps offer a real-time 'remote control' mode, where on-screen joystick buttons or tilt controls send live commands directly to the robot, similar to controlling an RC car." },
      { type: "h", text: "Feedback and Monitoring" },
      { type: "p", text: "Good robotics apps aren't one-directional. The robot can send data back to the app too, such as battery level, sensor readings, or a live camera feed, allowing the user to monitor the robot's status in real time." },
      { type: "h", text: "Why This Matters" },
      { type: "p", text: "Learning to work with an app-controlled robot builds intuition for a concept used throughout modern robotics and IoT devices: a control layer (the app) that communicates with a physical layer (the robot) over a wireless connection. This same pattern powers everything from smart home devices to industrial robotic fleets." }
    ],
    quiz: [
      { q: "What wireless technology is commonly used for short-range robot control?", options: ["Bluetooth", "Satellite", "Fiber optic cable", "AM radio"], correct: 0, explanation: "Bluetooth is a short-range wireless standard well suited to controlling nearby robots from a phone or app — satellite and fiber are used for very different, longer-range or wired purposes." },
      { q: "In block-based programming, what do the visual blocks represent?", options: ["Hardware parts", "Programming commands like 'move forward'", "Battery levels", "Wi-Fi passwords"], correct: 1, explanation: "Each visual block stands in for a programming command, letting you snap together instructions like 'move forward' without typing code." },
      { q: "What is 'real-time control mode' used for?", options: ["Writing code offline", "Sending live commands directly to the robot", "Charging the battery faster", "Updating firmware only"], correct: 1, explanation: "Real-time control mode sends commands to the robot the instant you issue them, letting you drive or operate it live rather than running pre-written code." },
      { q: "Why is block-based programming useful for beginners?", options: ["It requires memorizing syntax", "It lets you build behavior without memorizing programming syntax", "It only works with Wi-Fi", "It disables sensors"], correct: 1, explanation: "Block-based programming removes the need to memorize exact syntax, so beginners can focus on logic and sequencing instead of typing errors." },
      { q: "What kind of data can a robot send back to the app?", options: ["Only its name", "Battery level, sensor readings, or video", "Nothing, ever", "Only error sounds"], correct: 1, explanation: "Robots can stream useful feedback like battery level, sensor readings, or camera video back to the controlling app, not just a name or error sounds." },
      { q: "The 'app controls physical robot over wireless connection' pattern also powers:", options: ["Paper books", "Smart home devices and industrial robot fleets", "Analog clocks", "Traditional postal mail"], correct: 1, explanation: "That same app-to-device wireless control pattern is the basis for smart home gadgets and industrial robot fleets — it isn't limited to toy robots." }
    ]
  },
  {
    id: 5,
    grade: 4,
    title: "Line Follow",
    subtitle: "Building an autonomous machine",
    color: "var(--mod-5)",
    content: [
      { type: "h", text: "What Is a Line-Following Robot?" },
      { type: "p", text: "A line-following robot is a classic autonomous robotics project: a robot that uses sensors to detect a line on the ground (often black tape on a white surface) and automatically steers itself to stay on that path, with no human controlling it in real time." },
      { type: "h", text: "The Sensors Behind It" },
      { type: "p", text: "Line followers typically use infrared (IR) sensors mounted on the underside of the robot. These sensors shine light downward and measure how much of it reflects back — dark surfaces like a black line absorb more light, while light surfaces reflect more." },
      { type: "ul", items: [
        "Two or more IR sensors are placed side by side, straddling the line.",
        "When the line drifts under the left sensor, the robot turns left to re-center.",
        "When the line drifts under the right sensor, the robot turns right."
      ]},
      { type: "h", text: "The Control Logic" },
      { type: "p", text: "At its simplest, line-following logic is a set of conditional rules: if only the left sensor detects the line, turn left; if only the right sensor detects it, turn right; if both detect it, drive straight. More advanced versions use a technique called PID control, which smoothly adjusts motor speed based on how far off-center the robot has drifted, resulting in much smoother movement than simple on/off turning." },
      { type: "h", text: "Why Line Following Matters" },
      { type: "p", text: "This project might look simple, but it teaches core concepts used in real-world autonomous systems: continuously sensing the environment, comparing it to a target (the line), and adjusting behavior in real time to correct any error. Self-driving cars use a far more advanced version of this exact same feedback principle to stay centered in a lane." },
      { type: "h", text: "Building Your Own" },
      { type: "p", text: "To build a line follower, you generally need a small chassis, two motors with wheels, an IR sensor array, and a microcontroller to run the control logic. Testing on a simple looping track with gentle curves is the best way to start, before progressing to sharper turns and intersections." },
      { type: "h", text: "Autonomy as a Concept" },
      { type: "p", text: "'Autonomous' simply means a machine can operate and make decisions without a human directly controlling every action. A line follower is one of the simplest possible autonomous robots — but it demonstrates the same sense-decide-act loop found in every self-driving vehicle, delivery robot, and autonomous drone in the world today." }
    ],
    quiz: [
      { q: "What does a line-following robot typically detect?", options: ["Sound waves", "A line on the ground using light sensors", "Wi-Fi signals", "Air temperature"], correct: 1, explanation: "Line-following robots use light sensors to detect the contrast between a line and the surface around it — not sound, Wi-Fi, or temperature." },
      { q: "Which type of sensor is most commonly used for line following?", options: ["Microphone", "Infrared (IR) sensor", "Barometer", "Gyroscope only"], correct: 1, explanation: "Infrared (IR) sensors detect the difference in reflected light between a dark line and the lighter surface, making them the standard choice for line following." },
      { q: "If only the left sensor detects the line, what should the robot do?", options: ["Turn right", "Stop completely", "Turn left to re-center", "Reverse"], correct: 2, explanation: "If the left sensor sees the line, the robot has drifted right, so it should turn left to bring the line back under both sensors and re-center itself." },
      { q: "What does PID control provide compared to simple on/off turning?", options: ["Louder sound", "Smoother, more precise movement", "Longer battery life only", "Brighter lights"], correct: 1, explanation: "PID control adjusts steering by degree based on how far off-course the robot is, producing smoother, more precise correction than a simple on/off turn." },
      { q: "What does 'autonomous' mean in robotics?", options: ["Remote-controlled by a human at all times", "Operating and deciding without direct human control", "Powered only by solar energy", "Unable to move"], correct: 1, explanation: "Autonomous means the robot senses its environment and makes decisions on its own, without a human directly steering every move." },
      { q: "Line following demonstrates the same core principle used by:", options: ["Paper maps", "Self-driving cars staying centered in a lane", "Static wall posters", "Manual gear shifting"], correct: 1, explanation: "Both line-following robots and self-driving cars continuously sense their position relative to a target (a line or lane) and adjust in real time to stay centered." }
    ]
  }
];