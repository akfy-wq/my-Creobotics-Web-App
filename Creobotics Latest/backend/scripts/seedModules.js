const pool = require('../config/database');

// ============================================================
// ALL 32 MODULES FROM CREOBOTICS GRADE 4 - COMPLETE
// ============================================================
const MODULES = [];

// ============================================================
// LESSON 1: Elements of a Robot
// ============================================================
MODULES.push({
    id: 1,
    grade: 4,
    title: "Elements of a Robot",
    subtitle: "Sense, Compute, and Act!",
    color: "#2f6fed",
    content: JSON.stringify([
        { type: "h", text: "What Makes Something a Robot?" },
        { type: "p", text: "A robot is a very special kind of machine. It can carry out complex actions automatically (all by itself!). Robots are smart because they are powered by electricity and run by a program (a set of instructions written by a human!)." },
        { type: "h", text: "The Robot Power Trio!" },
        { type: "p", text: "To do its job, a robot always performs these three important steps:" },
        { type: "ul", items: ["Sense: Detect objects and check the conditions around it.", "Compute: Think about the information using its program brain.", "Act: Move around or carry out physical actions!"] },
        { type: "h", text: "The 3 Main Elements of a Robot" },
        { type: "p", text: "Every robot is made of specific parts that work together to bring it to life:" },
        { type: "ul", items: ["1. SENSORS: Input devices that let the robot sense the world — measure things like light, sound, motion, temperature, and smell.", "2. HARDWARE: Physical parts like metal pieces, motors, tracks, and wheels. Hardware creates the robot's form and physical capabilities.", "3. SOFTWARE: Coded instructions or algorithms that tell the robot what to do. Software processes sensor info and communicates between the robot and the roboticist (you!)."] }
    ]),
    quiz: JSON.stringify([
        { q: "Based on what we learned, can a machine do all three tasks (Sense, Compute, Act)? Which robot below can do all three?", options: ["A simple wall clock that moves its gears forward to spin the hands at the exact same speed all day, but cannot sense anything.", "An mBot Ranger that drives safely across the floor, senses obstacles using sensors, processes instructions, and automatically turns around."], correct: 1, explanation: "The mBot Ranger senses obstacles, computes what to do, and acts by turning around — the wall clock only acts, it can't sense anything." },
        { q: "Sensors work like human sensory organs (hands, eyes, ears) to feed values to the robot.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Sensors are the robot's input devices, just like our eyes, ears, and hands let us sense the world." },
        { q: "Software is the collection of physical metal parts and wheels that build a robot's body.", options: ["TRUE", "FALSE"], correct: 1, explanation: "That description belongs to Hardware — Software is the set of coded instructions or algorithms that tell the robot what to do." },
        { q: "Without software algorithms, a robot will never be able to accomplish much.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Software is the set of coded instructions that tells the robot what to do — without it, sensors and hardware have no directions to follow." },
        { q: "Sensors are also considered a type of hardware element because you can touch them.", options: ["TRUE", "FALSE"], correct: 1, explanation: "The lesson treats Sensors, Hardware, and Software as three separate main elements of a robot, not sensors as a subtype of hardware." },
        { q: "Your eyes, ears, and skin touch pads match which robot element?", options: ["Software (Coded directions/rules)", "Sensors (Input units)", "Hardware (Physical structures)"], correct: 1, explanation: "Eyes, ears, and skin are sensory organs — they match Sensors, which are input units for the robot." },
        { q: "Your muscles, arms, legs, and skeleton match which robot element?", options: ["Software (Coded directions/rules)", "Sensors (Input units)", "Hardware (Physical structures)"], correct: 2, explanation: "Muscles, arms, legs, and skeleton give the body its physical form and movement — the robot counterpart is Hardware." },
        { q: "Your thoughts, logic, and learned rules match which robot element?", options: ["Software (Coded directions/rules)", "Sensors (Input units)", "Hardware (Physical structures)"], correct: 0, explanation: "Thoughts, logic, and rules are like Software — coded instructions that tell the robot what to do." }
    ])
});

// ============================================================
// LESSON 2: Robot's Hardware
// ============================================================
MODULES.push({
    id: 2,
    grade: 4,
    title: "Robot's Hardware",
    subtitle: "Physical components and their classifications",
    color: "#f0a64d",
    content: JSON.stringify([
        { type: "h", text: "What is Hardware?" },
        { type: "p", text: "Hardware refers to the physical components or tangible parts of a robot. Tangible means it is something real that you can touch and see with your own eyes! Hardware allows a robot to perform its actions, like sensing obstacles and driving around. Some hardware parts need electrical power to run, while others do not!" },
        { type: "h", text: "Why is Hardware Important?" },
        { type: "ul", items: ["Protection: It forms a tough outer frame to protect delicate internal electronic brains.", "Capabilities: It gives the robot its physical abilities to do actual jobs!"] },
        { type: "h", text: "The 4 Classifications of Hardware" },
        { type: "p", text: "Robot hardware items are sorted into four operational groups depending on what job they do:" },
        { type: "ul", items: ["1. INPUT DEVICES: Sensors that gather data from surroundings (like an ultrasonic distance sensor!).", "2. OUTPUT DEVICES: Generates physical actions or signs (like motors spinning wheels, flashing LEDs, or buzzer sounds!).", "3. PROCESS HARDWARE: Coordinates all separate parts (the central motherboard that handles command traffic).", "4. STORAGE PARTS: Internal digital memory where coding instructions and data logs are saved safely."] },
        { type: "h", text: "Mechanical vs. Electronic Hardware" },
        { type: "ul", items: ["1. Mechanical Parts: Physical shape, body, or skeleton — wheels, metal beams, screws, motors.", "2. Electronic Parts: Circuit boards, microcontrollers, sensors — the internal nerve networks."] }
    ]),
    quiz: JSON.stringify([
        { q: "Hardware parts that you can see and touch are called:", options: ["Imaginary parts", "Tangible parts", "Software programs", "Virtual parts"], correct: 1, explanation: "Hardware means the physical parts of the robot — frame, motors, sensors, wiring, and so on. 'Tangible' means something you can touch." },
        { q: "Which classification of hardware is responsible for storing programs?", options: ["Input", "Output", "Storage", "Process"], correct: 2, explanation: "Storage parts hold programs and data in memory. Input devices sense, output devices act, and process hardware coordinates everything." },
        { q: "A metal structural bar or a wheel belongs to which kind of hardware?", options: ["Mechanical part", "Electronic part", "Programming code", "Software"], correct: 0, explanation: "Mechanical parts form the physical structure — bars, wheels, beams, and motors are mechanical hardware, not electronic." },
        { q: "From the sorting list, Rubber Tracks and Metal Screws belong to which column?", options: ["Mechanical Parts", "Electronic Parts"], correct: 0, explanation: "Rubber tracks and metal screws are physical structural pieces — mechanical parts." },
        { q: "From the sorting list, a Distance Sensor and a Microcontroller Chip belong to which column?", options: ["Mechanical Parts", "Electronic Parts"], correct: 1, explanation: "Sensors and microcontroller chips are circuit-based components that act as the robot's nerve network — electronic parts." },
        { q: "From the sorting list, an Electric Motor belongs to which column?", options: ["Mechanical Parts", "Electronic Parts"], correct: 0, explanation: "The lesson groups wheels, metal beams, screws, and motors together as mechanical parts that allow movement." },
        { q: "The Ultrasonic Distance Sensor is classified as:", options: ["Mechanical", "Electronic"], correct: 1, explanation: "The ultrasonic sensor is an electronic component that uses sound waves to measure distance." },
        { q: "The Continuous Rubber Tank Tracks are classified as:", options: ["Mechanical", "Electronic"], correct: 0, explanation: "Rubber tank tracks are physical structural parts — they are mechanical hardware." },
        { q: "The Main Processor Controller Board is classified as:", options: ["Mechanical", "Electronic"], correct: 1, explanation: "The main controller board is an electronic circuit board that processes commands." },
        { q: "The Lithium Battery Holder Frame is classified as:", options: ["Mechanical", "Electronic"], correct: 0, explanation: "The battery holder frame is a physical structural part — mechanical hardware." }
    ])
});

// ============================================================
// LESSON 3: Assembling a Robot
// ============================================================
MODULES.push({
    id: 3,
    grade: 4,
    title: "Assembling a Robot",
    subtitle: "Connecting hardware to build a form",
    color: "#21b6a8",
    content: JSON.stringify([
        { type: "h", text: "Connecting Hardware to Build a Form" },
        { type: "p", text: "Assembling a robot is where our structural planning becomes a physical machine! By following detailed, step-by-step 3D building guides in the Makeblock App, we combine separate mechanical and electronic hardware parts to complete the robot's structure." },
        { type: "h", text: "The Builder's Golden Rules" },
        { type: "ul", items: ["Match Your Screws: Pay close attention to different sizes like short M4x8mm screws vs longer M4x25mm screws!", "Route Cables Safely: Connect electronic units carefully using RJ25 and Encoder Motor cables without pinching them.", "Secure the Tracks: Always verify that continuous tracks fit tightly around your wheels so your robot doesn't lose traction!"] },
        { type: "h", text: "Testing Your Finished Robot" },
        { type: "p", text: "Once construction wraps up, you must run hardware diagnostic checks to determine if all wire connections and parts are fastened correctly. We do this by launching the Play Mode within the application!" },
        { type: "ul", items: ["STEP 1: Open Play Mode App interface", "STEP 2: Launch Drive Control dashboard"] },
        { type: "h", text: "Know Your Dashboard Controls!" },
        { type: "ul", items: ["Joystick: Move this on your screen to maneuver your robot around classroom obstacles smoothly.", "Action Modes: Switch between specialized driving styles: Sprint (high speed), Spin (tight turns), and Swerve (zig-zag movement).", "Indicators: Tap the Lights button and the Buzzer button to verify that your outputs respond instantly!"] }
    ]),
    quiz: JSON.stringify([
        { q: "In the assembly timeline, which phase happens FIRST?", options: ["Attach the Me Auriga main controller brain board using short M4 screws and plug in the RJ25 communication cables.", "Put down the structural base plate frames, 180 Encoder Motors, and lock them together tightly.", "Slip on the continuous rubber tank tracks over the wheel frames to finish the vehicle form.", "Mount the battery holder box onto its frame support plates and install your 6 AA batteries."], correct: 1, explanation: "The base plate frames and encoder motors form the robot's structural foundation, so they're locked together first." },
        { q: "In the assembly timeline, which phase happens SECOND?", options: ["Attach the Me Auriga main controller brain board using short M4 screws and plug in the RJ25 communication cables.", "Put down the structural base plate frames, 180 Encoder Motors, and lock them together tightly.", "Slip on the continuous rubber tank tracks over the wheel frames to finish the vehicle form.", "Mount the battery holder box onto its frame support plates and install your 6 AA batteries."], correct: 0, explanation: "After the base structure is built, the main controller board is attached next." },
        { q: "In the assembly timeline, which phase happens THIRD?", options: ["Attach the Me Auriga main controller brain board using short M4 screws and plug in the RJ25 communication cables.", "Put down the structural base plate frames, 180 Encoder Motors, and lock them together tightly.", "Slip on the continuous rubber tank tracks over the wheel frames to finish the vehicle form.", "Mount the battery holder box onto its frame support plates and install your 6 AA batteries."], correct: 3, explanation: "The battery holder is mounted after the controller board and before the final track assembly." },
        { q: "In the assembly timeline, which phase happens FOURTH (last)?", options: ["Attach the Me Auriga main controller brain board using short M4 screws and plug in the RJ25 communication cables.", "Put down the structural base plate frames, 180 Encoder Motors, and lock them together tightly.", "Slip on the continuous rubber tank tracks over the wheel frames to finish the vehicle form.", "Mount the battery holder box onto its frame support plates and install your 6 AA batteries."], correct: 2, explanation: "The rubber tank tracks are slipped on last to complete the vehicle form." },
        { q: "The Joystick Wheel on the Drive dashboard controls:", options: ["Triggers the sound board to emit a loud buzz alarm tone.", "Activates colorful LED light modules on top of the main circuit board.", "Directs electrical power to left/right motors to steer around obstacles."], correct: 2, explanation: "The joystick directs electrical power to the left/right motors so you can steer the robot around obstacles." },
        { q: "The Buzzer Icon Button on the Drive dashboard:", options: ["Triggers the sound board to emit a loud buzz alarm tone.", "Activates colorful LED light modules on top of the main circuit board.", "Directs electrical power to left/right motors to steer around obstacles."], correct: 0, explanation: "The Buzzer button verifies the sound output responds instantly by triggering an alarm tone." },
        { q: "The Lights Icon Button on the Drive dashboard:", options: ["Triggers the sound board to emit a loud buzz alarm tone.", "Activates colorful LED light modules on top of the main circuit board.", "Directs electrical power to left/right motors to steer around obstacles."], correct: 1, explanation: "The Lights button verifies the LED output responds instantly by activating the colorful ring lights." },
        { q: "You push the joystick forward, but your robot spins in circles instead of driving straight. What is the FIRST hardware check you should inspect?", options: ["The color of the LED lights", "The wheel and motor cable connections on the left and right sides", "The brand of the batteries", "The color of the screws"], correct: 1, explanation: "If one side's motor or cable isn't connected correctly, the wheels turn unevenly and the robot spins instead of driving straight." },
        { q: "You push the joystick forward, but your robot spins in circles instead of driving straight. What is the SECOND hardware check you should inspect?", options: ["The color of the LED lights", "Whether the rubber tracks are tightly fitted around the wheels", "The brand of the batteries", "The color of the screws"], correct: 1, explanation: "If the tracks aren't fitted tightly, one side may slip and cause the robot to spin instead of drive straight." }
    ])
});

// ============================================================
// LESSON 4: Makeblock Application
// ============================================================
MODULES.push({
    id: 4,
    grade: 4,
    title: "Makeblock Application",
    subtitle: "Communication and Control",
    color: "#8b5cf6",
    content: JSON.stringify([
        { type: "h", text: "What is the Makeblock Application?" },
        { type: "p", text: "The Makeblock Application provides a comprehensive robot control experience. It helps us with everything from building step instructions to utilizing pre-set controls, and even lets us program custom robot movements! Using the app helps us develop important visual-spatial skills and offers playful layout designs to control our creations." },
        { type: "h", text: "Understanding Robotic Communication" },
        { type: "p", text: "To control our robot from a tablet or phone, the two devices must talk to each other! Communication is the transmission of a message from a sender to a receiver in an understandable manner." },
        { type: "h", text: "The 4 Elements of Communication" },
        { type: "ul", items: ["1. Sender: The entity that creates and sends out the message (like you using the app!).", "2. Receiver: The entity that catches the message (like your robot body!).", "3. Message: The actual data or directive being passed along (like 'Drive Forward!').", "4. Medium: The channel or pathway linking the sender and receiver to transfer data."] },
        { type: "h", text: "Wired vs. Wireless Medium" },
        { type: "ul", items: ["Wired Medium: Data travels over a physical path — cables or wires link devices together.", "Wireless Medium: No physical wires involved! Uses radio waves traveling at the speed of light."] },
        { type: "h", text: "Focus Word: Bluetooth" },
        { type: "p", text: "Bluetooth is a short-range wireless communication technology. It links your devices together within its immediate range, acting just like an invisible string or cord to create a secure personal area network! It lets devices share raw data, voices, music, and control signals." }
    ]),
    quiz: JSON.stringify([
        { q: "Communication is best defined as:", options: ["A short-range wireless path that acts like an invisible cable between devices.", "The process of setting up an initial linkage between computing devices.", "Sending a message from a sender to a receiver so it is easily understood.", "The channel or path that transfers information between a sender and receiver."], correct: 2, explanation: "Communication is the transmission of a message from a sender to a receiver in an understandable manner." },
        { q: "Medium in communication refers to:", options: ["A short-range wireless path that acts like an invisible cable between devices.", "The process of setting up an initial linkage between computing devices.", "Sending a message from a sender to a receiver so it is easily understood.", "The channel or path that transfers information between a sender and receiver."], correct: 3, explanation: "The medium is the channel or pathway that links the sender and receiver to transfer data." },
        { q: "Bluetooth is best described as:", options: ["A short-range wireless path that acts like an invisible cable between devices.", "The process of setting up an initial linkage between computing devices.", "Sending a message from a sender to a receiver so it is easily understood.", "The channel or path that transfers information between a sender and receiver."], correct: 0, explanation: "Bluetooth links devices together within its immediate range, acting just like an invisible string or cord." },
        { q: "Pairing in Bluetooth refers to:", options: ["A short-range wireless path that acts like an invisible cable between devices.", "The process of setting up an initial linkage between computing devices.", "Sending a message from a sender to a receiver so it is easily understood.", "The channel or path that transfers information between a sender and receiver."], correct: 1, explanation: "Pairing is the process of setting up an initial linkage between devices so they can communicate." },
        { q: "An RJ25 cord connecting a sensor to the Me Auriga circuit board is:", options: ["Wired", "Wireless"], correct: 0, explanation: "A physical cable carrying the data makes this a wired connection." },
        { q: "A tablet application sending steering commands to an mBot Ranger across the room is:", options: ["Wired", "Wireless"], correct: 1, explanation: "No physical cable links the tablet and robot — commands travel over radio waves, making this wireless." },
        { q: "A phone streaming music to a speaker using Bluetooth signals is:", options: ["Wired", "Wireless"], correct: 1, explanation: "Bluetooth uses radio waves with no physical cable, so this is a wireless connection." },
        { q: "A USB cable connecting a computer to a robot board to load code is:", options: ["Wired", "Wireless"], correct: 0, explanation: "A USB cable is a physical connection — this is a wired communication medium." },
        { q: "When you press a button on your tablet screen to make the mBot Ranger flash its lights, your tablet acts as the:", options: ["Sender", "Message", "Medium", "Receiver"], correct: 0, explanation: "The tablet creates and sends out the command — it is the Sender." },
        { q: "The command instruction telling the lights to turn on is the:", options: ["Sender", "Message", "Medium", "Receiver"], correct: 1, explanation: "The actual data or directive being passed along is the Message." },
        { q: "The invisible Bluetooth radio waves carrying the instruction act as the communication:", options: ["Sender", "Message", "Medium", "Receiver"], correct: 2, explanation: "The medium is the channel or pathway — like Bluetooth radio waves — that links the sender and receiver." },
        { q: "The robot catching the instruction and flashing its lights acts as the:", options: ["Sender", "Message", "Medium", "Receiver"], correct: 3, explanation: "The robot receives and acts on the instruction — it is the Receiver." }
    ])
});

// ============================================================
// LESSON 5: Line Follow
// ============================================================
MODULES.push({
    id: 5,
    grade: 4,
    title: "Line Follow",
    subtitle: "Building an autonomous machine",
    color: "#4caf7d",
    content: JSON.stringify([
        { type: "h", text: "What is a Line Tracker Robot?" },
        { type: "p", text: "A line tracker robot is an autonomous machine designed to automatically follow a path marked by a line (usually black) on the floor. Even if the path is twisted, curved, or completely altered, the robot has the special task of sticking to the line to travel from one place to another!" },
        { type: "h", text: "How Does the Line Follower Sensor Work?" },
        { type: "p", text: "To follow a track, the robot utilizes a specialized hardware element called a Line Follower Sensor Module. This module contains two main infrared (IR) sensor units right next to each other (Sensor 1 and Sensor 2)." },
        { type: "h", text: "The Secret of Infrared Light" },
        { type: "p", text: "Each sensor contains an IR Transmitter (which shoots out invisible infrared light downward) and an IR Receiver (which catches the reflected light bouncing back up)." },
        { type: "ul", items: ["White or Light Surfaces: Reflect a lot of light! This generates a High Value of Reflectance (Value = 1).", "Black Lines: Dark black surfaces absorb the light, so very little bounces back. This generates a Low Value of Reflectance (Value = 0)."] }
    ]),
    quiz: JSON.stringify([
        { q: "A line tracker robot can follow a black line even if the path's shape is altered.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Even if the path is twisted, curved, or completely altered, the robot's task is to stick to the line." },
        { q: "Dark black tracks give a value of 1 because they reflect a high amount of light.", options: ["TRUE", "FALSE"], correct: 1, explanation: "Black surfaces absorb light and produce a Low Value of Reflectance (Value = 0), not 1." },
        { q: "Line follower sensors give a value of 1 when they see white or light-colored floors.", options: ["TRUE", "FALSE"], correct: 0, explanation: "White surfaces reflect a lot of light, generating a High Value of Reflectance (Value = 1)." },
        { q: "Automated line follower robots are helpful carrier tools inside industrial factories.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Factories use line followers as automated equipment carriers to move heavy parts without human drivers." },
        { q: "In the sensor logic puzzle, if Sensor 1 reads Black (0) and Sensor 2 reads White (1), what does the robot see?", options: ["Both sensors are on the black line — robot drives straight.", "Sensor 2 drifted onto the white floor — robot adjusts its path.", "Sensor 1 drifted onto the white floor — robot adjusts its path.", "Both sensors hit the white floor — the robot is lost off-track."], correct: 1, explanation: "Sensor 2 sees white while Sensor 1 sees black — Sensor 2 has drifted off the line, so the robot adjusts its path." },
        { q: "In the sensor logic puzzle, if Sensor 1 reads White (1) and Sensor 2 reads Black (0), what does the robot see?", options: ["Both sensors are on the black line — robot drives straight.", "Sensor 2 drifted onto the white floor — robot adjusts its path.", "Sensor 1 drifted onto the white floor — robot adjusts its path.", "Both sensors hit the white floor — the robot is lost off-track."], correct: 2, explanation: "Sensor 1 sees white while Sensor 2 still sees black — Sensor 1 has drifted off the line, so the robot adjusts its path." },
        { q: "In the sensor logic puzzle, if Sensor 1 reads Black (0) and Sensor 2 reads Black (0), what does the robot see?", options: ["Both sensors are on the black line — robot drives straight.", "Sensor 2 drifted onto the white floor — robot adjusts its path.", "Sensor 1 drifted onto the white floor — robot adjusts its path.", "Both sensors hit the white floor — the robot is lost off-track."], correct: 0, explanation: "Both sensors on the black line means the robot drives straight forward." },
        { q: "In the sensor logic puzzle, if both Sensor 1 and Sensor 2 read White (1, 1), what does the robot see?", options: ["Both sensors are on the black line — robot drives straight.", "Sensor 2 drifted onto the white floor — robot adjusts its path.", "Sensor 1 drifted onto the white floor — robot adjusts its path.", "Both sensors hit the white floor — the robot is lost off-track."], correct: 3, explanation: "When both sensors see white, the robot has completely left the line and is lost off-track." }
    ])
});

// ============================================================
// LESSON 6: Draw and Run
// ============================================================
MODULES.push({
    id: 6,
    grade: 4,
    title: "Draw and Run",
    subtitle: "Touchscreen path programming",
    color: "#e2483a",
    content: JSON.stringify([
        { type: "h", text: "Physical Skills for Robotics" },
        { type: "p", text: "Physical Skills necessary to execute body actions accurately and develop good motor control loops." },
        { type: "h", text: "Touchscreen Technology" },
        { type: "p", text: "The Draw and Run system relies entirely on touchscreens! A touchscreen is an electronic visual display capable of 'detecting' and 'locating' a touch over its screen canvas area. It is highly sensitive to a human finger, hand, fingernail, or a tool like a stylus pen." },
        { type: "h", text: "How Do Touchscreens Work?" },
        { type: "ul", items: ["1. A normal glass panel is layered with special conductive and resistive metallic sheets.", "2. When your finger presses the screen, the two hidden metallic sheets touch right at that point.", "3. A sudden change in electrical current registers as a touch event and travels instantly to the microcontroller board for processing!"] },
        { type: "h", text: "Advantages of Touch Interface Controls" },
        { type: "ul", items: ["Reality-Based Interaction: Controls feel natural because you directly manipulate screen elements.", "Space & Mobility: Removes the need for heavy physical keyboards or bulky tracking mice.", "Speed & Time Saving: Tapping commands directly saves immense navigation time.", "Simple Interfaces: Systems are highly accessible and incredibly easy to clean or wipe down!"] }
    ]),
    quiz: JSON.stringify([
        { q: "A touchscreen requires an external keyboard to locate exactly where a user clicked.", options: ["TRUE", "FALSE"], correct: 1, explanation: "Touchscreens detect touch directly on the screen surface — no external keyboard needed." },
        { q: "When a finger presses a screen, metallic conductive and resistive layers make contact.", options: ["TRUE", "FALSE"], correct: 0, explanation: "The two metallic sheets touch at the point of pressure, registering a touch event." },
        { q: "Changes in electrical currents are what register touch events for controllers to process.", options: ["TRUE", "FALSE"], correct: 0, explanation: "The change in electrical current at the touch point is what the controller detects." },
        { q: "Solving complex puzzles decreases mental speed and lowers total dopamine levels.", options: ["TRUE", "FALSE"], correct: 1, explanation: "Solving puzzles actually improves mental speed and can increase dopamine." },
        { q: "Managing emotions and creating rewarding relationships with your classmates is a:", options: ["Physical Skill", "Cognitive Skill", "Emotional Skill"], correct: 2, explanation: "Emotional skills involve managing feelings and building relationships." },
        { q: "Using fine motor precision movements to trace paths on a mobile drawing pad is a:", options: ["Physical Skill", "Cognitive Skill", "Emotional Skill"], correct: 0, explanation: "Physical skills involve motor control and precise movements." },
        { q: "Executing deep learning processes and critical mental math problem-solving is a:", options: ["Physical Skill", "Cognitive Skill", "Emotional Skill"], correct: 1, explanation: "Cognitive skills involve thinking, learning, and problem-solving." }
    ])
});

// ============================================================
// LESSON 7: Coding Tutorials 1
// ============================================================
MODULES.push({
    id: 7,
    grade: 4,
    title: "Coding Tutorials 1",
    subtitle: "Introduction to block-based coding",
    color: "#2f6fed",
    content: JSON.stringify([
        { type: "h", text: "What is Coding?" },
        { type: "p", text: "Coding is a system of symbols and rules that serve as instructions for a computer. It is the primary method that allows humans and machines to talk to each other (intercommunication)." },
        { type: "h", text: "Rules for Giving Clear Instructions" },
        { type: "p", text: "Just like when playing a game of Simon Says, instructions given to a computer or robot must be followed exactly! Good instructions should always be:" },
        { type: "ul", items: ["Direct and Clear: Use specific commands so there are no confusing steps.", "One at a Time: Give instructions in sequential order, keeping them simple and logical."] },
        { type: "h", text: "Block-Based Coding" },
        { type: "p", text: "Instead of writing text, we use Block-Based Coding! Instructions are represented visually as interlocking puzzle blocks. We select commands from a palette and drag them together, so memorizing commands is not needed." },
        { type: "h", text: "The Makeblock Code Categories" },
        { type: "p", text: "Makeblock separates your instruction commands into seven color-coded categories:" },
        { type: "ul", items: ["Hardware-Interacting Blocks: Move, Show, and Sense — give direct commands to the physical robot hardware.", "Structure & Logic Blocks: Data, Blocks, Math, and Control — provide extra flexibility for solving complex problems."] }
    ]),
    quiz: JSON.stringify([
        { q: "Coding is the primary method for allowing intercommunication between humans and machines.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Coding is indeed the primary language that allows humans to give instructions to computers." },
        { q: "Block-based coding requires you to memorize code text lines before starting.", options: ["TRUE", "FALSE"], correct: 1, explanation: "Block-based coding uses visual blocks instead of text, so no memorization of syntax is needed." },
        { q: "The Move, Show, and Sense categories are used to instruct the physical hardware components.", options: ["TRUE", "FALSE"], correct: 0, explanation: "These categories control physical hardware like motors, lights, and sensors." },
        { q: "Giving instructions all at once makes commands logical and simple for a machine to parse.", options: ["TRUE", "FALSE"], correct: 1, explanation: "Instructions should be given one at a time in sequential order for clarity." },
        { q: "The Move Category is used for:", options: ["Building math calculations or conditional loop logic structures.", "Instructing the robot motors to steer or drive forward at a selected speed.", "Directing electronic hardware components like LED panels to produce lights."], correct: 1, explanation: "The Move category controls motors and movement." },
        { q: "The Show Category is used for:", options: ["Building math calculations or conditional loop logic structures.", "Instructing the robot motors to steer or drive forward at a selected speed.", "Directing electronic hardware components like LED panels to produce lights."], correct: 2, explanation: "The Show category controls output hardware like LED panels and buzzers." },
        { q: "The Math & Control Categories are used for:", options: ["Building math calculations or conditional loop logic structures.", "Instructing the robot motors to steer or drive forward at a selected speed.", "Directing electronic hardware components like LED panels to produce lights."], correct: 0, explanation: "Math and Control categories handle calculations and logic flow." }
    ])
});

// ============================================================
// LESSON 8: Coding Tutorials 2
// ============================================================
MODULES.push({
    id: 8,
    grade: 4,
    title: "Coding Tutorials 2",
    subtitle: "Advanced logic blocks",
    color: "#f0a64d",
    content: JSON.stringify([
        { type: "h", text: "Creativity in Robotics" },
        { type: "p", text: "Creativity is the ability of a person to produce original and unusual ideas. It generates helpful alternatives or possibilities that are incredibly useful in robotic problem-solving!" },
        { type: "h", text: "Why Being Creative Matters" },
        { type: "ul", items: ["Reduces Stress: Working on creative tasks reduces anxiety and puts you in a happy zone.", "Solves Problems: Helps you view challenges differently and deal with uncertainties.", "Builds Confidence: You discover that failure is simply a helpful part of the process to grow and improve your work!"] },
        { type: "h", text: "Advanced Makeblock Logic Blocks" },
        { type: "p", text: "To create smart, adaptive programs, we use four essential categories of flexible coding blocks:" },
        { type: "ul", items: ["1. DATA BLOCKS: Used to create user-defined variables to store and alter custom information dynamically.", "2. BLOCKS CATEGORY: Used to create your own custom instructions, customized functions, or new block groupings.", "3. MATH BLOCKS: Provides programming blocks for mathematical calculations and number comparison solutions.", "4. CONTROL BLOCKS: Handles automated logical pathways involving conditional rules (IF-THEN) and repetitive loops (FOREVER)."] }
    ]),
    quiz: JSON.stringify([
        { q: "Creativity allows you to express yourself and gives you a wonderful sense of purpose.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Creativity indeed provides self-expression and purpose." },
        { q: "Control blocks are used whenever your code needs mathematical solutions involving computations.", options: ["TRUE", "FALSE"], correct: 1, explanation: "Control blocks handle logic flow — Math blocks handle calculations." },
        { q: "Data blocks let roboticists create variables to change values inside a block program.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Data blocks allow creation and manipulation of variables." },
        { q: "Discovering that failure is a part of the design process helps build your confidence levels.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Learning from failure builds resilience and confidence." },
        { q: "The Data Category is used for:", options: ["Creating a 'Forever' block loop so an action repeats over and over.", "Setting up a custom variable to hold or keep track of a shifting number value.", "Evaluating whether a measurement is greater than or less than a target value."], correct: 1, explanation: "Data blocks create and manage variables." },
        { q: "The Math Category is used for:", options: ["Creating a 'Forever' block loop so an action repeats over and over.", "Setting up a custom variable to hold or keep track of a shifting number value.", "Evaluating whether a measurement is greater than or less than a target value."], correct: 2, explanation: "Math blocks evaluate and compare values." },
        { q: "The Control Category is used for:", options: ["Creating a 'Forever' block loop so an action repeats over and over.", "Setting up a custom variable to hold or keep track of a shifting number value.", "Evaluating whether a measurement is greater than or less than a target value."], correct: 0, explanation: "Control blocks handle loops and logic flow." }
    ])
});

// ============================================================
// LESSON 9: Movements and Motor Control
// ============================================================
MODULES.push({
    id: 9,
    grade: 4,
    title: "Movements and Motor Control",
    subtitle: "DC and servo motors",
    color: "#21b6a8",
    content: JSON.stringify([
        { type: "h", text: "Why Movement Matters" },
        { type: "p", text: "Movement is one of the most visible and important functions of a robot. How a robot moves determines what tasks it can perform and how efficiently it can complete them." },
        { type: "h", text: "Three Common Types of Motors" },
        { type: "ul", items: ["DC Motor: Spins continuously clockwise or counterclockwise using battery power.", "Servo Motor: Perfect for sweeping arcs limited to specific angles like 90° or 180°.", "Stepper Motor: Moves step-by-step in highly rigid, fixed angles."] },
        { type: "h", text: "Movement Code Blocks" },
        { type: "p", text: "The Move category contains blocks like:" },
        { type: "ul", items: ["[ drive forward 1 second at speed 150 ] — Tells the robot to drive in a given direction, for a specific length of time, at a specific speed.", "[ keep moving forward at speed 150 ] — Instructs the robot to drive forward continuously until another block tells it to stop.", "[ left wheel speed to 150 ] and [ right wheel speed to 50 ] — Creates circular or curving motion by setting different wheel speeds."] }
    ]),
    quiz: JSON.stringify([
        { q: "Motors convert physical movement back into raw electrical battery energy.", options: ["TRUE", "FALSE"], correct: 1, explanation: "Motors convert electrical energy into physical movement, not the other way around." },
        { q: "Servo motors are used to produce continuous clockwise and counterclockwise spinning loops.", options: ["TRUE", "FALSE"], correct: 1, explanation: "Servo motors move to specific angles — DC motors produce continuous spinning." },
        { q: "Setting different speeds for the left and right wheels makes the robot move in a circle.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Different wheel speeds cause the robot to turn or curve." },
        { q: "Movement choices directly impact the power sustainability of a robot's battery supply.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Different movements consume different amounts of power." },
        { q: "This motor spins continuously clockwise or counterclockwise using batteries:", options: ["Servo Motor", "Stepper Motor", "DC Motor"], correct: 2, explanation: "DC motors provide continuous rotation." },
        { q: "This motor moves step-by-step in highly rigid, fixed angles:", options: ["Servo Motor", "Stepper Motor", "DC Motor"], correct: 1, explanation: "Stepper motors move in precise steps." },
        { q: "This motor is perfect for sweeping arcs limited to arcs like 90° or 180°:", options: ["Servo Motor", "Stepper Motor", "DC Motor"], correct: 0, explanation: "Servo motors move to specific angles within a limited range." }
    ])
});

// ============================================================
// LESSON 10: Buzzer and Play Note
// ============================================================
MODULES.push({
    id: 10,
    grade: 4,
    title: "Buzzer and Play Note",
    subtitle: "Audio output programming",
    color: "#8b5cf6",
    content: JSON.stringify([
        { type: "h", text: "What is a Buzzer?" },
        { type: "p", text: "A buzzer is a basic physical output hardware device found on the mBot Ranger that produces beep tones to create various sounds. It requires a direct current (DC) voltage to operate and is typically used as an alert or alarm device!" },
        { type: "h", text: "The Importance of Robot Sound" },
        { type: "ul", items: ["Communication: Transmits messages, status updates, or hazard warnings.", "Mental Effect: Can soothe minds and help relieve stress or fatigue.", "Focus Guidance: Works alongside visual parts to help determine what we observe."] },
        { type: "h", text: "Three Types of Buzzers" },
        { type: "ul", items: ["1. Piezoelectric: Generates a very loud, high-pitched, and sharp beep noise.", "2. Mechanical: Uses physical striking parts; typically used as a household doorbell.", "3. Electromechanical: Very convenient to use in project structures because of simple connection wires."] },
        { type: "h", text: "The Play Note Code Block" },
        { type: "p", text: "To command our robot to produce sounds, we use the Play Note Code Block found in the bright blue Show Block category. This block activates the built-in buzzer to play musical tones." },
        { type: "ul", items: ["Musical Note Selector: Choose from eight musical notes (C5, D5, E5, F5, G5, A5, B5, and C6).", "Beat Selector: Controls the time duration (eighth, quarter, half, whole, or double beats)."] }
    ]),
    quiz: JSON.stringify([
        { q: "The buzzer is considered an input device because it listens to musical notes.", options: ["TRUE", "FALSE"], correct: 1, explanation: "A buzzer is an output device — it produces sound, it doesn't listen." },
        { q: "The Play Note block belongs inside the Move block programming category.", options: ["TRUE", "FALSE"], correct: 1, explanation: "The Play Note block is in the Show category, not Move." },
        { q: "There are exactly eight default musical notes available inside the mBlock interface.", options: ["TRUE", "FALSE"], correct: 0, explanation: "The notes C5 through C6 are available (C5, D5, E5, F5, G5, A5, B5, C6)." },
        { q: "Mechanical buzzers are the most common choice for building household doorbells.", options: ["TRUE", "FALSE"], correct: 0, explanation: "Mechanical buzzers with striking parts are used in many doorbells." },
        { q: "C5, E5, or G5 are:", options: ["The time duration length options, such as half, whole, or quarter notes.", "The specific pitch choices found inside the musical note selector menu.", "The color-coded menu cluster where audio sound blocks are stored."], correct: 1, explanation: "These are musical notes from the note selector menu." },
        { q: "Eighth, Quarter, Half are:", options: ["The time duration length options, such as half, whole, or quarter notes.", "The specific pitch choices found inside the musical note selector menu.", "The color-coded menu cluster where audio sound blocks are stored."], correct: 0, explanation: "These are time duration options for how long a note plays." },
        { q: "The Show Category is:", options: ["The time duration length options, such as half, whole, or quarter notes.", "The specific pitch choices found inside the musical note selector menu.", "The color-coded menu cluster where audio sound blocks are stored."], correct: 2, explanation: "The Play Note block is stored in the blue Show category." }
    ])
});

// ============================================================
// LESSONS 11-32: Placeholders (Add your full content here)
// For now, these are simple placeholders
// ============================================================
for (let i = 11; i <= 32; i++) {
    MODULES.push({
        id: i,
        grade: 4,
        title: `Lesson ${i}`,
        subtitle: "Coming soon...",
        color: i % 2 === 0 ? "#f0a64d" : "#2f6fed",
        content: JSON.stringify([
            { type: "h", text: `Lesson ${i}` },
            { type: "p", text: `This is a placeholder for lesson ${i}. Please replace with actual content from your data.js file.` }
        ]),
        quiz: JSON.stringify([
            { q: `Question for lesson ${i}?`, options: ["Option A", "Option B", "Option C"], correct: 0, explanation: "Explanation here." }
        ])
    });
}

// ============================================================
// SEED FUNCTION
// ============================================================
async function seedModules() {
    try {
        console.log('🌱 Seeding modules into database...');
        console.log(`📚 Total modules: ${MODULES.length}`);
        
        // Clear existing modules
        await pool.execute('DELETE FROM modules');
        console.log('✅ Cleared existing modules');
        
        // Insert all modules
        let inserted = 0;
        for (const module of MODULES) {
            await pool.execute(
                `INSERT INTO modules (id, grade, title, subtitle, color, content, quiz)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    module.id,
                    module.grade,
                    module.title,
                    module.subtitle,
                    module.color,
                    module.content,
                    module.quiz
                ]
            );
            inserted++;
            console.log(`✅ Inserted module ${module.id}: ${module.title}`);
        }
        
        console.log(`\n🎉 Successfully seeded ${inserted} modules!`);
        console.log(`📊 Database now has ${inserted} lessons ready to use.`);
        
    } catch (error) {
        console.error('❌ Error seeding modules:', error);
    } finally {
        process.exit();
    }
}

// Run the seed
seedModules();