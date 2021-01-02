Support for the Minut Smart Home Monitoring Wi-Fi device support for Homey.

Minut device does monitor: noise, motion, temperature, humidity, air pressure and mold indication. 
Beside monitoring, it's also a security device which works as sensor for Heimdall app, and works as a Sirene if there is alarm.

Supported devices:
* Minut  (old name was Minut Point) 

Prerequests:
* at least one Minut device
* Installed the Minut and registerd at Minut website before addind to Homey.

Minut works with Homes and Devices, a Minut device is place in a Home and there can be multiple Minuts be in one Home. Monitoring is performed by the Minuts and statistics are readable per devices. Alarm functions from Minut for Noise and Motion are clustered into the Homes, but in the Homey per Minut device (PIR). So if one or more Minuts are detecting motion or to much noise, then the Home device in the Homey is triggered.


Homey devices for PIR and their functions:
* Minut Point
  * Read Data for the following items:
    * Air pressure (mbar)
    * Temperature
    * Humidity
    * Mold risk (yes/no
    * Sound.
    * Lux (not supported by Minut API yet)
    * Battery level
  * React to alarms of:
    * Motion (PIR)
    * High/Low Air pressure.
    * High/low Temperature.
    * High/low Humidity.
    * High/low Noise.

* Home (device in Homey) 
  * Activate/Decativate alarm control using flow cards 
  * With alarm delay of 40 seconds (non adjustable)


Support notes:
1. To use this app there is no subscription service from Minut needed.
2. Alarm thresholts for like Noise, temp and humidity can be set using the Android, iOS or WebApp from Minut.
3. Add a battery monitoring flow to make sure you charge the battery of the Minut on time.
4. Alarm functions from Home can be used and activated, but are not connected to Heimdall, you can use the Minuts as additional/separate alarm devices, next to Heimdall of you can use them as sensors only. In this last case the Home device is not needed to be added to Homey.
You can make flows which arm/disarm Minuts based on Heimdall alarm state

Supported Languages:
* English    
* Dutch    

Release notes:
* version 1.2.0
  * Adds support for Glass break detection
* version 1.0.9
  * fix issue with alarm motion
* version 1.0.8
  * Added support for motion detection
