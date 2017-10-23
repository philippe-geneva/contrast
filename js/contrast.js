/*
 *
 */

var params = {
  nH: 5,              // Number of horizontal polylines
  nV: 4               // Number of vertical polylines
}

/*
 * Compute the colour difference between two color codes using a 
 * weighted euclidean distance:
 *     ________________________________________ 
 *   \/ 2*(R2-R1)^2 + 4*(G2-G1)^2 + 3*(B2-B1)^2
 */

function colourDifference ( c1, c2 )
{
  var head_c1 = 0;
  if (c1.substr(0,1) == "#") 
  {
    head_c1 = 1;
  }
  var head_c2 = 0;
  if (c2.substr(0,1) == "#")
  {
    head_c2 = 1;
  }
  var delta_red =  parseInt(c1.substr(head_c1,2),16) 
                 - parseInt(c2.substr(head_c2,2),16);
  var delta_grn =  parseInt(c1.substr(head_c1+2,2),16) 
                 - parseInt(c2.substr(head_c2+2,2),16);
  var delta_blu =  parseInt(c1.substr(head_c1+4,2),16) 
                 - parseInt(c2.substr(head_c2+4,2),16);
  var difference = Math.sqrt(  2*delta_red*delta_red 
                             + 4*delta_grn*delta_grn 
                             + 3*delta_blu*delta_blu);
  return difference;
}

/*
 * Generate a random colour code
 */

function randomColour()
{
  var colour = "#";
  var digit = "0123456789ABCDEF";
  for (var n = 0; n < 6; n++)
  {
    var m = Math.floor(Math.random()*16);
    colour += digit.substr(m,1);
  }
  return colour;
}

/*
 * Generate a random colour similar to the specified colour
 * where the difference between the two is at least as much as d_min
 * and less than d_max.
 */

function similarRandomColour ( colour, d_min, d_max )
{
  var new_colour;
  var d = d_max+1;
  var iterations = 0;
  while ((d < d_min) || (d > d_max)) 
  {
    iterations += 1;
    new_colour = randomColour(); 
    d = colourDifference(new_colour,colour);
  }
  console.log("Computing similar colour with " + iterations + " iterations.");
  return new_colour;
}



 
function getIntersection ( a , b )
{
  var s1_i = a[1].i-a[0].i;
  var s1_j = a[1].j-a[0].j;
  var s2_i = b[1].i-b[0].i;
  var s2_j = b[1].j-b[0].j;
  var s = (-s1_j*(a[0].i-b[0].i) + s1_i*(a[0].j-b[0].j))/(-s2_i*s1_j+s1_i*s2_j);
  var t = ( s2_i*(a[0].j-b[0].j) - s2_j*(a[0].i-b[0].i))/(-s2_i*s1_j+s1_i*s2_j);

  if ((s >= 0) && (s <= 1) && (t >= 0) && (t <= 1))
  {
    return { 
      i: a[0].i+(t*s1_i),
      j: a[0].j+(t*s1_j)
    };
  }
  
  // No intersection 

  return null; 
}

/*
 *
 */

function getPolygon ( H1, H2, V1, V2  )
{
  var P = new Array();
  var vertex = null;
  var u = 0;
  var v = 0;
  
  // Find the top left vertex

  for (u = 0; u < (H1.length-1); u++)
  {
    for (v = 0; v < (V1.length-1); v++)
    {
      vertex = getIntersection([H1[u],H1[u+1]],[V1[v],V1[v+1]]);
      if (vertex != null) break;
    }
    if (vertex != null) break;
  }
  P[P.length] = vertex;

  // Find the top right vertex, save intermediate points between the  
  // top left and top right vertices.

  for (;u < (H1.length-1); u++)
  {
    for (v = 0; v < (V2.length-1); v++)
    {
      vertex = getIntersection([H1[u],H1[u+1]],[V2[v],V2[v+1]]);
      if (vertex != null) break;
    }
    if (vertex != null) break;
    P[P.length] = H1[u+1];
  }
  P[P.length] = vertex;

  // Find the bottom right vertex, save intermediate points between the
  // top right and bottom right vertices.

  for (;v < (V2.length-1); v++)
  {
    for (u = (H2.length-1); u > 0; u--) 
    {
      vertex = getIntersection([H2[u],H2[u-1]],[V2[v],V2[v+1]]);
      if (vertex != null) break;
    }
    if (vertex != null) break;
    P[P.length] = V2[v+1];
  }
  P[P.length] = vertex;

  // Find the bottom left vertex, save intermediate points between the
  // bottom right and bottom left vertices.

  for (; u > 0; u--)
  {
    for (v = (V1.length-1); v > 0; v--)
    {
      vertex = getIntersection([H2[u],H2[u-1]],[V1[v],V1[v-1]]);
      if (vertex != null) break;
    }
    if (vertex != null) break;
    P[P.length] = H2[u-1];
  }
  P[P.length] = vertex;

  // Find the top left vertex, save the intermediate points between the
  // bottom left vertex and the top left vertex.  For this pass we dont 
  // save the top left vertex since it is the first one that we found.

  for (;v > 0; v--)
  {
    for (u = 0; u < (H1.length-1); u++)
    {
      vertex = getIntersection([H1[u],H1[u+1]],[V1[v],V1[v-1]]);
      if (vertex != null) break;
    }
    if (vertex != null) break;
    P[P.length] = V1[v-1];
  }

  return P;
}


function mkPolygonMatrix ( p, l )
{
  var M = new Array();
  for (var u = 0; u < (p.nV-1); u++)
  {
    M[u] = new Array();
    for (var v = 0; v < (p.nH-1); v++)
    {
      console.log("Polygon " + u + " , " + v);
      M[u][v] = getPolygon(l.H[v],l.H[v+1],l.V[u],l.V[u+1]);
    }
  }
  return M;
} 


/* 
 *
 */

function mkRandomPoints( n, r )
{
  var points = Math.floor((n-r) +  Math.random() * (2*r+1));
  var point = new Array();
  for (var m = 0; m < points; m++)
  {
    point[m] = Math.random();
  } 
  point.sort(
    function(a,b) 
    {
       return a-b;
    }
  );
  return point
}

/*
 * Generate intersecting zig zag lines according to provided parameters.
 * The returned structure contains an two arrays of lines, H, horizontal lines
 * and V, vertical lines.  Each entry in the array is a zig-zagging polyline
 * consisting of a series of points in the following structure { i: , j: }
 * with floating point values ranging from 0.0 to 1.0
 */

function mkLines ( p )
{

  var H = new Array(); // Create the array of horizontal lines
  var V = new Array(); // Create the array of vertical lines
  var spaceH = 1.0/(p.nH-1); // Space between horizontal lines
  var spaceV = 1.0/(p.nV-1); // Space between vertical lines

  // Create the first horizontal line - this one is the top edge of
  // the image, so by definition it must be straight.  It has only
  // two points.

  H[0] = new Array(); 
  H[0][0] = { i: 0.0, j: 0.0 };  
  H[0][1] = { i: 1.0, j: 0.0 };

  // Now create the polylines inside the image

  for (var n = 1; n < (p.nH-1); n++) 
  {
 
    // Create a new polyline and decide which side it will start on

    H[n] = new Array();
    var sign = (Math.random() >= 0.5) ? 1 : -1;
 
    // First point of the polyline is always on the leftmost edge

    H[n][0] = { 
      i: 0.0, 
      j: spaceH * (n + (Math.random() / p.d * sign))
    };

    // Now do the internal points of the polyline.

    for (var m = 1; m < (p.nV-1) ; m++) 
    {
      sign *= -1;
      H[n][H[n].length] = { 
        i: spaceV * m, 
        j: spaceH * (n + (Math.random() / p.d * sign)) 
      };
    }
  
    // Last point of the polyline, always on the rightmost edge.

    sign *= -1;
    H[n][H[n].length] = { 
      i: 1.0, 
      j: spaceH * (n + (Math.random() / p.d * sign))
    };
  }

  // Create the final polyline, this is the bottom edge of the image and
  // must therefore also be straight, so only two points here as well.

  H[H.length] = new Array();
  H[H.length-1][0] = { 
    i: 0.0, 
    j: 1.0 
  };
  H[H.length-1][1] = { 
    i: 1.0, 
    j: 1.0 
  };

  // The vertical lines use the transposed version of the previous code.
  // Create the first vertical line - this one is the left edge of
  // the image, so by definition it must be straight.  It has only
  // two points.

  V[0] = new Array();
  V[0][0] = { i: 0.0, j: 0.0 };
  V[0][1] = { i: 0.0, j: 1.0 };

  // Now create the polylines inside the image

  for (var n = 1; n < (p.nV-1); n++) 
  {

    // Create a new polyline and decide if it will start skewed a little
    // bit to the left (sign = -1) or the right (sign = 1)

    V[n] = new Array();
    var sign = (Math.random() >= 0.5) ? 1 : -1;

    // First point of the polyline is always on the topmost edge

    V[n][0] = { 
      i: spaceV * (n + (Math.random() / p.d * sign)),
      j: 0.0
    };

    // Now do the internal points of the polyline.

    var point = mkRandomPoints(p.nH-2,1);

    for (var m = 1; m < (p.nH-1) ; m++) 
//    for (var m = 0; m < point.length; m++)
    {
      sign *= -1;
      V[n][V[n].length] = { 
        i: spaceV * (n + (Math.random() / p.d * sign)),
        j: spaceH * m 
//        j: point[m]
      };
    }

    // Last point of the polyline, always on the bottom edge.

    sign *= -1;
    V[n][V[n].length] = { 
      i: spaceV * (n + (Math.random() / p.d * sign)),
      j: 1.0
    };
  }

  // Create the final polyline, this is the right edge of the image and
  // must therefore also be straight, so only two points here as well.

  V[V.length] = new Array();
  V[V.length-1][0] = { 
    i: 1.0, 
    j: 0.0 
  };
  V[V.length-1][1] = { 
    i: 1.0, 
    j: 1.0 
  };

  return { H, V };
}

