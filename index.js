var cv = require( 'opencv' );
var robot = require( 'robotjs' );
var Jimp = require( 'jimp' );

// fs.writeFile('output.png',  img.image);

// img.save("screencapture.png");

var hoop_template = {
  x: 173,
  y: 13
};
var basketball_template = {
  x: 171,
  y: 181
};

setTimeout( () => Main(), 2000 );

async function Main() {

  console.log( "Started!" );

  while ( true ) {
    await findAndShoot();
    await timeout( 3000 );
  }

}



function screenCaptureToFile( robotScreenPic ) {
  return new Promise( ( resolve, reject ) => {
    try {
      console.log( "screenCaptureToFile" );
      const image = new Jimp( robotScreenPic.width, robotScreenPic.height );
      let pos = 0;
      image.scan( 0, 0, image.bitmap.width, image.bitmap.height, ( x, y, idx ) => {
        /* eslint-disable no-plusplus */
        image.bitmap.data[ idx + 2 ] = robotScreenPic.image.readUInt8( pos++ );
        image.bitmap.data[ idx + 1 ] = robotScreenPic.image.readUInt8( pos++ );
        image.bitmap.data[ idx + 0 ] = robotScreenPic.image.readUInt8( pos++ );
        image.bitmap.data[ idx + 3 ] = robotScreenPic.image.readUInt8( pos++ );
        /* eslint-enable no-plusplus */
      } );
      resolve( screenSave( image , "screen" ) );
    } catch ( e ) {
      console.error( e );
      reject( e );
    }
  } );
}

function screenSave( image, file_name ) {
  return new Promise( ( resolve, reject ) => {
    image.write( `${file_name}.jpg`, ( err, ret ) => err ? reject( err ) : resolve( ret ) );
  } )
}

function imageToMatrix( image_path ) {
  return new Promise( ( resolve, reject ) => {
    cv.readImage( image_path, ( err, matrix ) => err ? reject( err ) : resolve( matrix ) );
  } )
}

async function findObjPosition() {

  var output;

  var picture = robot.screen.capture();
  await screenCaptureToFile( picture );

  var screen_matrix = await imageToMatrix( "./screen.jpg" );
  var hoop_matrix = await imageToMatrix( "./hoop.jpg" );

  var basketball_matrix = await imageToMatrix( "./basketball.jpg" );

  output = screen_matrix.matchTemplateByMatrix( hoop_matrix, 3 );
  var hoop_match = output.templateMatches( 0.8, 1.0, 1 );

  output = screen_matrix.matchTemplateByMatrix( basketball_matrix, 3 );
  var basketball_match = output.templateMatches( 0.8, 1.0, 1 );

  return {
    screen_matrix,
    hoop_match,
    basketball_match
  };

}


async function findAndShoot() {

  var screen_matrix, hoop_match, basketball_match, baseline;
  var flag = false;

  ( {
    screen_matrix,
    hoop_match,
    basketball_match
  } = await findObjPosition() );


  if ( !hoop_match[ 0 ] || !basketball_match[ 0 ] ) {
    console.log( "No Result Found!" );
    return false;
  } else {

    hoop_match = hoop_match[ 0 ];
    basketball_match = basketball_match[ 0 ];

  }

  screen_matrix.line( [ hoop_match.x, hoop_match.y ], [ hoop_match.x + hoop_template.x, hoop_match.y + hoop_template.y ] );
  screen_matrix.line( [ basketball_match.x, basketball_match.y ], [ basketball_match.x + basketball_template.x, basketball_match.y + basketball_template.y ] );

  screen_matrix.save( './debug.jpg' )

  var hoop_center_position = {
    x: hoop_match.x + hoop_template.x / 2,
    y: hoop_match.y + hoop_template.y / 2
  }

  var basketball_center_position = {
    x: basketball_match.x + basketball_template.x / 2,
    y: basketball_match.y + basketball_template.y / 2
  }

  console.log( "hoop_center_position" , hoop_center_position );
  console.log( "basketball_center_position" , basketball_center_position );

  var shoot_target = hoop_center_position;

  shoot_target.x -= ( hoop_center_position.x - basketball_center_position.x ) * 0.5;
  console.log( "diff", shoot_target.x );

  robot.moveMouse( basketball_center_position.x, basketball_center_position.y );
  robot.mouseToggle( "down" );
  robot.dragMouse( shoot_target.x, shoot_target.y );
  robot.mouseToggle( "up" );

}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// My Second Attempt (Unable to save screen capture and matrix_1 cannot be read , so async await... )

/*
function Main() {

  screenCaptureToFile( picture )
    .then( () => openCVreadImage( "./test.jpg" ) )
    .then( ( matrix_1 ) => openCVreadImage( "./goal.jpg" ) )
    .then( ( matrix_2 ) => {

      console.log( "passed" );

      var output = matrix_1.matchTemplateByMatrix( matrix_2, 3 );
      var matches = output.templateMatches( 0.8, 1.0, 10 );

      for ( var i = 0; i < matches.length; i++ ) {
        var x = matches[ i ]
        matrix_1.line( [ x.x, x.y ], [ x.x + 165, x.y + 136 ] );
      }

      matrix_1.save( './out.jpg' )
      console.log( matches );
    } )
}

*/


// My first Attempt (Unable to save screen capture)

/*
function Main() {

  screenCaptureToFile( picture ).then( ( image ) => {

    image.write("test.jpg");
    let matches;

    cv.readImage( './test.jpg', function( err, im ) {
      if ( err ) return console.error( 'error loading image' );

      var output = im.matchTemplate( './goal.jpg', 3 );

      im.line( [ output[ 1 ], output[ 2 ] ], [ output[ 1 ] + output[ 3 ], output[ 2 ] + output[ 4 ] ] );
      im.save( './out2.jpg' );

      console.log( console );
      matches = output[ 0 ].templateMatches( 0, 1.0, 1, false );

      console.log( matches );
    } );

    if ( matches[ 0 ] ) {
      robot.moveMouse( matches[ 0 ].x, matches[ 0 ].y );
    } else {
      robot.moveMouse( 100, 600 );
    }
  } )
}
*/
