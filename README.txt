This app will integrate the minute point into the Athom homey

there are 2 devices added by this app:

* Minut Point
  * Read Data for the following items:
    * Pressure
    * Temperature
    * humidity
    * sound.
    * light
  * React to alarms of:
    * High/Low pressure.
    * High/low temperature.
    * High/low humidity.
    * High/low sound.
* PointHome:
  * Read Data for:
    * Alarm State.
  * React to:
    * change of alarm state

Changelog:
  * migrated to new webhook (added button to remove old)
  * added option to disable live logging to reduce memory 
  * New app name.
  * New app images
  * reduced memory usage