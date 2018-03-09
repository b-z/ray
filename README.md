# Report of the 2<sup>nd</sup> Homework of CG Course

####Zhou Bowei
####2015.12.30

***

### 1. How can I run

```bash
cd path-to-this-folder/
```

then (python2):

``` bash
python -m SimpleHTTPServer
```

or (python3):

``` bash
python -m http.server --cgi
```

Open [127.0.0.1:8000](http://127.0.0.1:8000/) in your browser.  

You can also run it [online](http://b-z.github.io/ray).

### 2. How can I use

* Choose a model from the listed models. Then click the "RUN" button.

<div style="text-align:center;">
<img src="img/report/p1.png" width=300>
</div>

* Adjust the orientationl.

<div style="text-align:center;">
<img src="img/report/p2.png" width=300>
</div>

* Open the "RAY TRACING" panel. Adjust the parameters.

<div style="text-align:center;">
<img src="img/report/p3.png" width=300>
</div>

* Click the "RUN" button, and have a cup of tea🍵

<div style="text-align:center;">
<img src="img/report/p4.png" width=300>
</div>

### 3. Advantages & Disadvantages

* Advantages:  
  * Only using JavaScript, means that you can run it on every platforms, including iOS & Android.
  * Area light
  * Depth of field
* Disadvantages
  * No global illumination
  * No refraction or reflection (Mar.2018 added)
  * No smooth surface
  * Inefficient (because JavaScript doesn't have mechanism of multi-thread and could not use GPU)

### 4. Gallery

<div style="text-align:center;">
<img src="img/gallery/box_12_2_0.2#3.png" width=40%><img src="img/gallery/bunny_6_1_0.2#1.png" width=40%>
</div>

<div style="text-align:center;">
<img src="img/gallery/teapot_8_2_0.2.png" width=40%><img src="img/gallery/gourd_10_2_0.2.png" width=40%>
</div>

<div style="text-align:center;">
<img src="img/gallery/hand_4_1.png" width=40%><img src="img/gallery/lion_4.png" width=40%>
</div>

<div style="text-align:center;">
<img src="img/gallery/sphere_4_6_0.5_0.png" width=40%><img src="img/gallery/cone_4_6_0.5_0.png" width=40%>
</div>

#### Old version:

***

<div style="text-align:center;">
<img src="img/gallery/box.png" width=40%><img src="img/gallery/bunny.png" width=40%>
</div>

<div style="text-align:center;">
<img src="img/gallery/teapot.png" width=40%><img src="img/gallery/gourd.png" width=40%>
</div>

<div style="text-align:center;">
<img src="img/gallery/hand.png" width=40%><img src="img/gallery/lion.png" width=40%>
</div>


