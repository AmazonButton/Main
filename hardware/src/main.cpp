#include <Arduino.h>
#include "core/StateMachine.h"

void setup() {
  // Execute non-blocking state machine cycle
  StateMachine::run();
}

void loop() {
  // Never reached because device enters Deep Sleep in StateMachine::run()
}
