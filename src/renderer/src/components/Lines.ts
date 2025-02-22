
import type { Relation, Card } from "../types/card"

function BoxIntersection(s,e,A,B) {
    let t = [(A[0]-s[0])/e[0], (A[1]-s[1])/e[1], (B[0]-s[0])/e[0], (B[1]-s[1])/e[1]];

    let maxT = -Infinity, minT = Infinity, maxInd,minInd;
    for (let i = 0; i < t.length; i++) {
        if (maxT < t[i]) {
            maxT = t[i];
            maxInd = i;
        }
        if (minT > t[i]) {
            minT = t[i];
            minInd = i;
        }
    }
    if (minInd > maxInd) {
        t.splice(minInd,1);
        t.splice(maxInd,1);
    } else {
        t.splice(maxInd,1);
        t.splice(minInd,1);
    }

    if (t[0] > t[1])
        t = [t[1],t[0]];

    return t;
}
function DrawLine(ctx: CanvasRenderingContext2D,p1: number[],p2: number[]) {
    ctx.moveTo(p1[0],p1[1]);
    ctx.lineTo(p2[0],p2[1]);
}
function DrawArrow(ctx: CanvasRenderingContext2D,p1:number[],p2: number[],offsets: number[]) {
    let normal = [(p2[1]-p1[1]),-(p2[0]-p1[0])];
    let L = Math.sqrt(normal[0]**2+normal[1]**2);
    normal[0] /= L; normal[1] /= L;
    let tangent = [-normal[1],normal[0]];

    DrawLine(ctx,p1,p2);
    DrawLine(ctx,p2,[p2[0]-normal[0]*offsets[0]-tangent[0]*offsets[1], p2[1]-normal[1]*offsets[0]-tangent[1]*offsets[1]]);
    DrawLine(ctx,p2,[p2[0]+normal[0]*offsets[0]-tangent[0]*offsets[1], p2[1]+normal[1]*offsets[0]-tangent[1]*offsets[1]]);
}
function DrawRelations(ctx: CanvasRenderingContext2D, cards: Card[], cardsRel: Relation[]) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < cardsRel.length; i++) {
        let parent = cards.find((v)=>{return v.id==cardsRel[i].first});
        let child = cards.find((v)=>{return v.id==cardsRel[i].second});
        
        if (parent && child && parent.DOM && child.DOM) {
            let parentRect = parent.DOM.getBoundingClientRect();
            let childRect = child.DOM.getBoundingClientRect();

            let startPoint = [parentRect.left+parentRect.width/2,parentRect.top+parentRect.height/2];
            let endPoint = [childRect.left+childRect.width/2,childRect.top+childRect.height/2];

            let intersection1 = BoxIntersection(startPoint,[(endPoint[0]-startPoint[0]),(endPoint[1]-startPoint[1])],[childRect.left,childRect.top],[childRect.left+childRect.width,childRect.top+parentRect.height]);
            let intersection2 = BoxIntersection(startPoint,[(endPoint[0]-startPoint[0]),(endPoint[1]-startPoint[1])],[parentRect.left,parentRect.top],[parentRect.left+parentRect.width,parentRect.top+parentRect.height]);

            intersection1[0] -= 0.03;
            intersection2[1] += 0.03;

            DrawArrow(ctx,[startPoint[0]+(endPoint[0]-startPoint[0])*intersection2[1],startPoint[1]+(endPoint[1]-startPoint[1])*intersection2[1]],
                        [startPoint[0]+(endPoint[0]-startPoint[0])*intersection1[0],startPoint[1]+(endPoint[1]-startPoint[1])*intersection1[0]],
                        [5,10]);
        }
    }
    ctx.stroke();
}

export {DrawRelations, DrawArrow, DrawLine, BoxIntersection};