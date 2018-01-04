// Calcule les normales des vertex. La normale de chaque vertex est
// la moyenne des triangles voisins.
//
// vertices: la liste des vertex.
// ind: la liste des indices.
// retour: la liste des normales par vertex.
function calcNormals(vertices, ind){
  var x=0; 
  var y=1;
  var z=2;
	var v1 = [], v2 = [], thisNormal = [];

	// initialiser la liste des normales.
  var ns = [];
  for(var i=0;i<vertices.length;i++)
	{
    ns[i]=0.0;
  }

  for(var i=0;i<ind.length;i=i+3){
    //v1 = p1 - p0
    v1[x] = vertices[3*ind[i+1]+x] - vertices[3*ind[i]+x];
    v1[y] = vertices[3*ind[i+1]+y] - vertices[3*ind[i]+y];
    v1[z] = vertices[3*ind[i+1]+z] - vertices[3*ind[i]+z];

    // v2 = p2 - p1
    v2[x] = vertices[3*ind[i+2]+x] - vertices[3*ind[i]+x];
    v2[y] = vertices[3*ind[i+2]+y] - vertices[3*ind[i]+y];
    v2[z] = vertices[3*ind[i+2]+z] - vertices[3*ind[i]+z];            

    // N = v2 x v1 (cross product).
    thisNormal[x] = v1[y]*v2[z] - v1[z]*v2[y];
    thisNormal[y] = v1[z]*v2[x] - v1[x]*v2[z];
    thisNormal[z] = v1[x]*v2[y] - v1[y]*v2[x];

    for(j=0;j<3;j++)
		{
			// N += thisNormal. on additionne les normales. 
      ns[3*ind[i+j]+x] =  ns[3*ind[i+j]+x] + thisNormal[x];
      ns[3*ind[i+j]+y] =  ns[3*ind[i+j]+y] + thisNormal[y];
      ns[3*ind[i+j]+z] =  ns[3*ind[i+j]+z] + thisNormal[z];
    }
  }

  // Normalisation.
  for(var i=0;i<vertices.length;i=i+3){ 

    var nn=[];
		var len = 0;
		for(var j = 0; j < 3; j++)
		{
			nn[j] = ns[i+j];
			len += nn[j] * nn[j];
		}

		// La norme de la normale.
		len = Math.sqrt(len);
    if (len == 0) 
			len = 0.00001;

		for(var j = 0; j < 3; j++)
    	ns[i+j] = nn[j] / len;

		//console.log(len);
  }

  return ns;
}
