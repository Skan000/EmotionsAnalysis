from flask import Flask, render_template, request, jsonify
import cv2
import time
import Path

# export FLASK_APP=server.py && export FLASK_ENV=development && flask run
# export FLASK_APP=server.py && export FLASK_ENV=development && flask run --host=0.0.0.0
# localhost:5000

app = Flask(__name__)
app.debug = True
# app.run(host = '192.33.203.197',port=5000)
app.run(host='0.0.0.0' , port=5000)

# url_for('static', filename='animate.min.css')
# url_for('static', filename='bootstrap.min.css')
# url_for('static', filename='flexslider.css')
# url_for('static', filename='font-icon.css')
# url_for('static', filename='main.css')
# url_for('static', filename='responsive.css')
# url_for('static', filename='jquery.fancybox.css')


@app.route('/')
def hello_world():
    return render_template('index.html')


@app.route('/diagrams', methods=['GET'])
def diagram():
    return render_template('diagrams.html')


@app.route('/path', methods=['GET', 'POST'])
# Function to get the value of the emotions in order to generate the path
def get_emotions_path():
    app.logger.debug("JSON received...")
    app.logger.debug(request.get_json(force=True))

    if request.json:
        mydata = request.json
        # return the new image of the path
        print("CIAOOOO")
        Path.EmoDist([.2, .2, .2, .2, .2, .2, .2])
        return "Thanks. Your Surprise value is %s" % mydata.get("surprise")
    else:
        return "no json received"


@app.route('/experiment', methods=['GET'])
def get_camera():
    camera_port = 0
    # camera = cv2.VideoCapture(camera_port)
    # time.sleep(0.1)
    # return_value, image = camera.read()
    # cv2.imwrite("user.png", image)

    cap = cv2.VideoCapture(camera_port)
    time.sleep(0.1)
    framerate = cap.get(5)
    x = 1

    # while(True):
    #     # Capture frame-by-frame
    #     ret, frame = cap.read()
    #     cap.release()
    #     # Our operations on the frame come here
    #     filename = str(int(x)) + ".png"
    #     x = x+1
    #     cv2.imwrite(filename, frame)
    #     time.sleep(5)
    #     if cv2.waitKey(1) & 0xFF == ord('q'):
    #         break

    # # When everything done, release the capture
    # cap.release()
    # cv2.destroyAllWindows()
    del camera

    # Send all to microsoft and return a JSON
    result =   {
        "faceRectangle": {
        "top": 141,
        "left": 130,
        "width": 162,
        "height": 162
        },
        "scores": {
        "anger": 9.29041E-06,
        "contempt": 0.000118981574,
        "disgust": 3.15619363E-05,
        "fear": 0.000589638,
        "happiness": 0.06630674,
        "neutral": 0.00555004273,
        "sadness": 7.44669524E-06,
        "surprise": 0.9273863
        }
    }

    # del camera
    return jsonify(result)


