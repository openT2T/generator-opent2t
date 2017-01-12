# generator-opent2t [![NPM version][npm-image]][npm-url]
> Yeoman generator for an Open Translators to Things translator. Gets you up and running quickly.

## Installation

First, install [Yeoman](http://yeoman.io) and generator-opent2t using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
$ npm install -g yo
$ npm install -g generator-opent2t
```

Then generate your new project:

```bash
$ yo opent2t

     _-----_
    |       |    .--------------------------.
    |--(o)--|    |    Welcome to the Open   |
   `---------´   |   Translators to Things  |
    ( _´U`_ )    |        generator!        |
    /___A___\    '--------------------------'
     |  ~  |
   __'.___.'__
 ´   `  |° ´ Y `

? What is the human-readable name of the thing you are writing a translator for (e.g. Contoso Light)? Wink Light Bulb
? What is the node package name you want to use (e.g. translator-contoso-light)? translator-wink-light
? What schema does this translator implement? (Use arrow keys)
> org.OpenT2T.Sample.SuperPopular.Lamp
  org.OpenT2T.Sample.SuperPopular.Shade
  org.OpenT2T.Sample.SuperPopular.TemperatureSensor
? What onboarding model does this translator implement? (Use arrow keys)
  org.OpenT2T.Onboarding.BluetoothLE
  org.OpenT2T.Onboarding.Manual
  org.OpenT2T.Onboarding.OAuth2
> org.OpenT2T.Onboarding.WinkHub
  org.OpenT2T.Onboarding.ZWave
  Writing files...
  package.json generated. OpenT2T translators use the MIT license.
   create dist\js\thingTranslator.js
   create dist\js\manifest.xml
   create dist\js\package.json
```

The generator will ask you some questions, and based on your answers create a starter translator under dist/js. Move to your final desired location, and enjoy!

## Getting To Know Yeoman

Yeoman has a heart of gold. He&#39;s a person with feelings and opinions, but he&#39;s very easy to work with. If you think he&#39;s too opinionated, he can be easily convinced. Feel free to [learn more about him](http://yeoman.io/).

[npm-image]: https://badge.fury.io/js/generator-opent2t.svg
[npm-url]: https://npmjs.org/package/generator-opent2t

## Code of Conduct
This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

