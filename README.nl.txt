Ondersteuning voor de Minut Smart Home Monitoring Wi-Fi-apparaat voor Homey.

Minut-apparaat controleert: geluid, beweging, temperatuur, vochtigheid, luchtdruk en schimmelindicatie.
Naast monitoring is het ook een beveiligingsapparaat dat werkt als sensor voor de Heimdall-app en als een Sirene werkt als er een alarm is.

Ondersteunde apparaten:
* Minut (oude naam was Minut Point)

Vereisten:
* minimaal één Minut-apparaat
* De Minut geïnstalleerd en geregistreerd op de Minut-website voordat hij aan Homey werd toegevoegd.

Minut werkt met Homes en Devices, een Minut-apparaat wordt in een Home geplaatst en er kunnen meerdere Minuts in één Home zijn. Monitoring wordt uitgevoerd door de Minuts en statistieken zijn per apparaat leesbaar. Alarmfuncties van Minut for Noise en Motion zijn geclusterd in de Homes, maar in het Homey per Minut-apparaat (PIR). Dus als één of meerdere Minuts beweging of teveel geluid detecteren, dan wordt het Home-apparaat in de Homey geactiveerd.


Homey apparaten voor PIR en hun functies:
* Minuutpunt
  * Lees gegevens voor de volgende items:
    * Luchtdruk (mbar)
    * Temperatuur
    * Vochtigheid
    * Schimmelrisico (ja / nee)
    * Geluid.
    * Lux (nog niet ondersteund door Minut API)
    * Batterijniveau
  * Reageer op alarmen van:
    * Beweging (PIR)
    * Hoge / lage luchtdruk.
    * Hoge / lage temperatuur.
    * Hoge / lage vochtigheid.
    * Hoge / lage ruis.

* Home (apparaat in Homey)
  * Activeer / Deactiveer alarmcontrole met behulp van flow kaarten
  * Met alarmvertraging van 40 seconden (niet instelbaar)


Ondersteuning opmerkingen:
1. Om deze app te gebruiken is er geen abonnements van Minut nodig.
2. Alarmdrempels voor bijvoorbeeld geluid, temperatuur en luchtvochtigheid kunnen worden ingesteld met behulp van de Android, iOS of WebApp van Minut.
3. Voeg een batterijbewakingsstroom toe om ervoor te zorgen dat u de batterij van de Minut op tijd oplaadt.
4. Alarmfuncties van Home kunnen worden gebruikt en geactiveerd, maar zijn niet aangesloten op Heimdall, u kunt de Minuts gebruiken als extra / losse alarmapparaten, naast Heimdall kunt u ze alleen als sensoren gebruiken. In dit laatste geval hoeft het Home-apparaat niet aan Homey te worden toegevoegd.
U kunt stromen maken die Minuts in- / uitschakelen op basis van de Heimdall-alarmstatus

Ondersteunde talen:
* Engels
* Nederlands

  
